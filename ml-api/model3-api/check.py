import requests
import json

# URL of the FastAPI server's text generation endpoint
API_URL = "http://127.0.0.1:8000/generate-text"

# The instruction and input text to send to the model
# You can change these to test different prompts
payload = {
    "instruction": "Create a mind map based on the following FIR report.",
    "input_text": "On 15th May 2024, a complaint was filed by Mr. Sharma regarding a theft at his residence. The incident occurred between 10 PM and 11 PM. The suspect was seen wearing a red jacket. Items stolen include a laptop and jewelry."
}

try:
    print("Sending request to the server...")
    # Make a POST request with streaming enabled
    response = requests.post(API_URL, json=payload, stream=True)

    # Check if the request was successful
    response.raise_for_status()

    print("\n--- Server Response ---")
    # Iterate over the response content chunk by chunk (token by token)
    for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
        if chunk:
            # Print each token as it arrives
            print(chunk, end='', flush=True)
    
    print("\n-----------------------\n")
    print("Stream finished.")


except requests.exceptions.RequestException as e:
    print(f"\nAn error occurred: {e}")
    print("Please ensure the FastAPI server is running and accessible at the specified URL.")

except Exception as e:
    print(f"\nAn unexpected error occurred: {e}")

