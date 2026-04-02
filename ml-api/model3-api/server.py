from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware # Import CORS Middleware
from pydantic import BaseModel
import uvicorn
from pypdf import PdfReader
import io
from typing import Dict, Generator, Optional
import os
import json
import requests
import re
from dotenv import load_dotenv

load_dotenv()

# Optional OCR libraries
try:
    from PIL import Image
    import pytesseract
    tcmd = os.environ.get("TESSERACT_CMD")
    if tcmd:
        try:
            pytesseract.pytesseract.tesseract_cmd = tcmd
        except Exception:
            pass

    # Validate that the tesseract binary is available and usable
    try:
        # This will raise if the binary isn't found
        pytesseract.get_tesseract_version()
        OCR_AVAILABLE = True
    except Exception:
        OCR_AVAILABLE = False
except Exception:
    Image = None
    pytesseract = None
    OCR_AVAILABLE = False

# pdf->image converter for OCR fallback
try:
    from pdf2image import convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except Exception:
    convert_from_bytes = None
    PDF2IMAGE_AVAILABLE = False

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_MAX_TOKENS = os.environ.get("GROQ_MAX_TOKENS")

# ------------------------
# FastAPI app
app = FastAPI(title="AI Mind Map Generator API")

# --- Add CORS Middleware ---
# This is the crucial part. We need to add the origin of your React app
# (e.g., "http://localhost:5173") to this list.
origins = [
    "*",  # Allow all origins (updated for deployment)
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- Pydantic Models ---
class InstructionRequest(BaseModel):
    instruction: str
    input_text: str = ""

# --- Helper functions for Groq streaming generation ---
def _build_chat_payload(instruction: str, input_text: str, max_tokens: Optional[int] = None) -> Dict:
    user_prompt = (
        "Task: Build a CASE-CRACKING investigation mind map from the case brief below.\n\n"
        f"Operating Rules:\n{instruction}\n\n"
        "Case Brief:\n"
        f"{input_text}\n\n"
        "Output Format Requirements:\n"
        "- Plain indented text only (no markdown).\n"
        "- Use short lines suitable for node labels.\n"
        "- Keep hierarchy clear using indentation.\n"
        "- Mandatory sections: Lead Theory, Suspect Ranking, Breakthrough Evidence Path, Next 24-Hour Actions, IPC Mapping, Final Primary Suspect.\n"
        "- Every suspect entry must include: motive, opportunity, capability, and verification clue.\n"
        "- Breakthrough Evidence Path must be a step-by-step chain from clue to charge-ready proof.\n"
        "- End with one strongest suspect + reason + likely IPC sections.\n"
        "- Use this indentation style exactly:\n"
        "Investigation Hypothesis Map\n"
        "  Lead Theory\n"
        "    Main motive angle\n"
        "  Suspect Ranking\n"
        "    Suspect 1\n"
        "      Motive\n"
        "      Opportunity\n"
        "      Capability\n"
        "      Verification clue\n"
        "  Breakthrough Evidence Path\n"
        "    Action 1\n"
        "    Action 2\n"
        "    Action 3\n"
        "  Final Primary Suspect\n"
        "    Name or profile\n"
        "    Why this suspect\n"
        "    Likely IPC sections\n"
        "Begin output now:\n"
    )
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a senior Indian police investigation officer drafting a live case analysis map. "
                    "Reason like an investigator under real constraints: timeline, motive, opportunity, means, corroboration, and contradictions. "
                    "Your objective is to crack the case, not summarize it. "
                    "Generate only actionable hypotheses that can be verified through evidence collection. "
                    "Avoid generic SOP text and avoid speculation without a traceable clue from the case brief. "
                    "When citing IPC sections, include only sections that are plausibly triggered by described facts. "
                    "If case details are missing, still provide best-possible tactical hypotheses and clearly mark assumptions as assumptions. "
                    "Write concise node-style lines in ASCII-safe plain text with indentation suitable for mind-map rendering."
                ),
            },
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "stream": True,
    }

    # If no explicit limit is configured, let the provider decide its natural completion cap.
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens

    return payload


def _sanitize_output_text(text: str) -> str:
    """Removes mojibake/control characters so frontend nodes render cleanly."""
    replacements = {
        "â€™": "'",
        "â€˜": "'",
        "â€œ": '"',
        "â€": '"',
        "â€“": "-",
        "â€”": "-",
        "Â": "",
        "�": "",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)

    # Keep printable ASCII plus newline/tab for predictable rendering in the mind-map UI.
    text = re.sub(r"[^\x09\x0A\x0D\x20-\x7E]", "", text)
    return text


def _open_groq_stream(payload: Dict) -> requests.Response:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not set. Configure it in your environment before starting this service.",
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        upstream = requests.post(
            GROQ_API_URL,
            headers=headers,
            json=payload,
            stream=True,
            timeout=120,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Groq connection failed: {str(exc)}")

    if upstream.status_code >= 400:
        detail = upstream.text
        upstream.close()
        raise HTTPException(status_code=502, detail=f"Groq API error: {detail}")

    return upstream


def _stream_groq_response(upstream: requests.Response) -> Generator[str, None, None]:
    try:
        for raw_line in upstream.iter_lines(decode_unicode=True):
            if not raw_line or not raw_line.startswith("data: "):
                continue

            data = raw_line[len("data: "):].strip()
            if data == "[DONE]":
                break

            try:
                chunk = json.loads(data)
            except json.JSONDecodeError:
                continue

            choices = chunk.get("choices", [])
            if not choices:
                continue

            delta = choices[0].get("delta", {})
            token = delta.get("content")
            if token:
                cleaned = _sanitize_output_text(token)
                if cleaned:
                    yield cleaned
    finally:
        upstream.close()

# --- API Endpoints ---

@app.post("/generate-text")
async def generate_from_text(req: InstructionRequest):
    """
    Generates a response from raw text input, streaming the output.
    """
    try:
        configured_max = int(GROQ_MAX_TOKENS) if GROQ_MAX_TOKENS else None
        payload = _build_chat_payload(req.instruction, req.input_text, max_tokens=configured_max)
        upstream = _open_groq_stream(payload)
        return StreamingResponse(_stream_groq_response(upstream), media_type="text/plain")

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-from-file")
async def generate_from_file(instruction: str = Form(...), file: UploadFile = File(...)):
    """
    Generates a response from an uploaded file (PDF or Image), streaming the output.
    """
    try:
        content_type = file.content_type
        input_text = ""

        if content_type == "application/pdf":
            print("Processing PDF file...")
            pdf_content = await file.read()
            pdf_stream = io.BytesIO(pdf_content)
            reader = PdfReader(pdf_stream)
            for page in reader.pages:
                input_text += page.extract_text() or ""
            # If pypdf extraction failed (likely scanned PDF), try OCR fallback
            if not input_text:
                if not OCR_AVAILABLE:
                    raise HTTPException(
                        status_code=400,
                        detail=("Could not extract text with pypdf and OCR libraries are not available. "
                                "Install Pillow and pytesseract for OCR fallback, and ensure Tesseract is installed on your system.")
                    )

                # Try to use pdf2image to convert pages to images and then OCR
                if not PDF2IMAGE_AVAILABLE:
                    raise HTTPException(
                        status_code=400,
                        detail=("PDF appears to be scanned (no text extracted). To enable OCR fallback install pdf2image and poppler, "
                                "and also Pillow+pytesseract. See README for platform-specific poppler/tesseract install steps.")
                    )

                try:
                    images = convert_from_bytes(pdf_content)
                    for img in images:
                        page_text = pytesseract.image_to_string(img)
                        input_text += page_text or ""
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"PDF OCR fallback failed: {str(e)}")
        
        elif "image/" in content_type:
            print(f"Received image file: {content_type}")
            image_bytes = await file.read()
            if not OCR_AVAILABLE:
                raise HTTPException(
                    status_code=400,
                    detail=("Image OCR is not available because Pillow and/or pytesseract are not installed. "
                            "Install 'pillow' and 'pytesseract' and ensure the Tesseract binary is installed and on PATH.")
                )

            try:
                img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                input_text = pytesseract.image_to_string(img)
                if not input_text:
                    raise HTTPException(status_code=400, detail="No text detected in the image via OCR.")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Image OCR failed: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

        configured_max = int(GROQ_MAX_TOKENS) if GROQ_MAX_TOKENS else None
        payload = _build_chat_payload(instruction, input_text, max_tokens=configured_max)
        upstream = _open_groq_stream(payload)
        return StreamingResponse(_stream_groq_response(upstream), media_type="text/plain")

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# ------------------------
# To run the server: uvicorn server:app --reload
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
