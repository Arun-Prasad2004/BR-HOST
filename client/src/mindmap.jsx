import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";
import "@xyflow/react/dist/style.css";
import "./mindmap.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

const sanitizeMindMapText = (rawText) => {
  if (!rawText) return "";

  const normalized = rawText
    .replace(/â€™|â€˜/g, "'")
    .replace(/â€œ|â€\x9d|â€/g, '"')
    .replace(/â€“|â€”/g, "-")
    .replace(/Â/g, "")
    .replace(/�/g, "");

  return normalized.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
};

// Function to measure node height based on label content
const getNodeHeight = (label, isCentral) => {
  const measureDiv = document.createElement("div");
  measureDiv.style.position = "absolute";
  measureDiv.style.visibility = "hidden";
  measureDiv.style.width = `230px`; // nodeWidth - 20px padding
  measureDiv.style.padding = "10px";
  measureDiv.style.fontFamily = "'Inter', sans-serif";
  measureDiv.style.fontSize = "14px";
  measureDiv.style.fontWeight = isCentral ? "700" : "500";
  measureDiv.style.whiteSpace = "normal";
  measureDiv.style.wordBreak = "break-word";
  measureDiv.style.lineHeight = "1.5"; // Approximate if set in CSS
  measureDiv.style.color = "#fff";
  document.body.appendChild(measureDiv);
  measureDiv.innerText = label;
  const height = measureDiv.clientHeight;
  document.body.removeChild(measureDiv);
  return height;
};

// Layout logic: converts indented text into nodes and edges
const getLayoutedElements = (lines) => {
  const nodes = [];
  const edges = [];
  const nodeWidth = 250;
  const horizontalGap = 300;
  const verticalGap = 60;

  const roots = [];
  const stack = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return; // Skip empty lines
    const id = `node-${index}`;
    
    const labelFull = trimmed.replace(/[\*#`]/g, "").replace(/^-/, "").trim();
    
    // Extract short neat labels for the UI while keeping the flow intact
    let label = labelFull;
    const colonIndex = labelFull.indexOf(":");
    if (colonIndex !== -1 && colonIndex < 40) {
      label = labelFull.substring(0, colonIndex).trim();
    } else if (labelFull.length > 50) {
      label = labelFull.substring(0, 47) + "...";
    }

    const indentation = line.search(/\S|$/);
    const newNode = { id, label, indentation, children: [] };
    while (stack.length && stack[stack.length - 1].indentation >= indentation) {
      stack.pop();
    }
    if (stack.length) {
      stack[stack.length - 1].children.push(newNode);
    } else {
      roots.push(newNode);
    }
    stack.push(newNode);
  });

  if (!roots.length) return { nodes, edges };

  // For simplicity, assume single root (common for mind maps). If multiple, we can handle by stacking.
  let root = roots[0];
  if (roots.length > 1) {
    // Optional: Create a super root if multiple top-level nodes
    root = { id: "super-root", label: "Investigation Hypothesis Map", indentation: -1, children: roots };
  }

  // Traverse to compute node heights
  const traverse = (node) => {
    node.nodeHeight = getNodeHeight(node.label, node.indentation <= 0);
    node.children.forEach(traverse);
  };
  traverse(root);

  // Calculate subtree heights
  const calcHeight = (node) => {
    if (!node.children.length) {
      return (node.subtreeHeight = node.nodeHeight);
    }
    let h = 0;
    node.children.forEach((child) => {
      h += calcHeight(child) + verticalGap;
    });
    node.subtreeHeight = h - verticalGap;
    return node.subtreeHeight;
  };
  calcHeight(root);

  // Assign positions (y is treated as center y)
  const assignPos = (node, x = 0, y = 0) => {
    nodes.push({
      id: node.id,
      data: { label: node.label },
      position: { x, y: y - node.nodeHeight / 2 },
      style: {
        width: nodeWidth,
        padding: 10,
        background:
          node.indentation <= 0
            ? "linear-gradient(160deg, #ffffff, #d5d5d5)"
            : "linear-gradient(180deg, #171717, #0d0d0d)",
        color: node.indentation <= 0 ? "#050505" : "#f4f4f4",
        borderRadius: 14,
        fontWeight: node.indentation <= 0 ? 700 : 500,
        border: node.indentation <= 0 ? "1px solid #ffffff" : "1px solid #5a5a5a",
        boxShadow: "0 10px 24px rgba(0,0,0,0.42)",
      },
    });

    let curY = y - (node.subtreeHeight - node.nodeHeight) / 2;
    node.children.forEach((child) => {
      const cx = x + nodeWidth + horizontalGap;
      const cy = curY + child.subtreeHeight / 2;
      assignPos(child, cx, cy);
      edges.push({
        id: `edge-${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#7e7e7e", strokeWidth: 2.5 },
      });
      curY += child.subtreeHeight + verticalGap;
    });
  };
  assignPos(root);

  return { nodes, edges };
};

export default function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [inputType, setInputType] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  const getFinalConclusion = (mindMapText) => {
    const lines = mindMapText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return "Final conclusion could not be extracted from the generated response.";
    }

    const headingIndex = lines.findIndex((line) =>
      /final primary suspect|final conclusion|primary suspect/i.test(line)
    );

    if (headingIndex !== -1) {
      const sectionLines = [];
      for (let i = headingIndex; i < Math.min(lines.length, headingIndex + 8); i += 1) {
        sectionLines.push(lines[i]);
      }
      return sectionLines.join("\n");
    }

    return lines.slice(Math.max(0, lines.length - 6)).join("\n");
  };

  const buildCaseReportData = (mindMapText) => {
    const generatedAt = new Date().toLocaleString();
    const finalConclusion = getFinalConclusion(mindMapText);
    const sourceInfo = inputType === "text" ? "Text Input" : `${inputType.toUpperCase()} File (${fileName || "uploaded"})`;
    const caseInput = inputType === "text" ? (textInput || "N/A") : "Input extracted from uploaded file by OCR/PDF parsing.";

    return {
      generatedAt,
      sourceInfo,
      caseInput,
      finalConclusion,
      detailedMindMap: mindMapText,
    };
  };

  const downloadReport = () => {
    if (!reportData) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (neededHeight = 24) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addWrappedText = (text, fontSize = 11, lineHeight = 16) => {
      const safeText = text || "N/A";
      doc.setFontSize(fontSize);
      const wrapped = doc.splitTextToSize(safeText, contentWidth);
      wrapped.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
    };

    const addSectionTitle = (title) => {
      y += 6;
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, margin, y);
      y += 10;
      doc.setDrawColor(60);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BailReckoner Investigation Report", margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70);
    doc.text(`Generated At: ${reportData.generatedAt}`, margin, y);
    y += 14;
    doc.text(`Source: ${reportData.sourceInfo}`, margin, y);
    doc.setTextColor(0);
    y += 18;

    addSectionTitle("Case Input");
    addWrappedText(reportData.caseInput, 11, 16);

    addSectionTitle("Final Conclusion");
    addWrappedText(reportData.finalConclusion, 11, 16);

    addSectionTitle("Detailed Mind Map");
    addWrappedText(reportData.detailedMindMap, 10.5, 15);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`investigation-report-${timestamp}.pdf`);
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  const generateMindMap = async () => {
    setIsLoading(true);
    setError("");
    setReportData(null);
    setNodes([]);
    setEdges([]);
    const instruction = `
  Act as a police investigation officer trying to crack the case.
  Produce an actionable strategy map in plain indented text.

  CRITICAL FORMATTING RULE: 
  Every single line must be formatted precisely as:
  Short Title: Detailed full explanation
  
  IMPORTANT: NEVER use generic labels like "Action 1", "Suspect 1", or "Point 1" for the Short Title. 
  The Short Title MUST be a descriptive 2-4 word summary of the content.
  - For actions, use action verbs (e.g., "Review CCTV Footage: Check casino cameras")
  - For suspects, use their name (e.g., "John Malone: Verify alibi timeline")
  
  Example:
  Lead Theory: The suspect orchestrated a break-in to cover up embezzlement.
    John Malone: Cannot account for his whereabouts during the time of the robbery.
      Gambling Debts: Facing bankruptcy and needed immediate cash flow.

  Mandatory sections to include:
  Lead Theory
  Suspect Ranking (top 3)
  Breakthrough Evidence Path
  Next 24-Hour Actions
  Likely IPC Mapping
  Final Primary Suspect

  End with one strongest suspect and why.
  `; 
    try {
      let response;
      if (inputType === "text") {
        if (!textInput) throw new Error("Please enter some text.");
        response = await fetch("https://br-host-ml-3.onrender.com/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction, input_text: textInput }),
        });
      } else {
        if (!file) throw new Error(`Please upload a ${inputType} file.`);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("instruction", instruction);
        response = await fetch("https://br-host-ml-3.onrender.com/generate-from-file", {
          method: "POST",
          body: formData,
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Unknown error");
      }

      // Stream reading
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value, { stream: true });
        const cleanedText = sanitizeMindMapText(accumulatedText);
        const { nodes: newNodes, edges: newEdges } = getLayoutedElements(
          cleanedText.split("\n")
        );
        setNodes(newNodes);
        setEdges(newEdges);
      }

      const finalCleanedText = sanitizeMindMapText(accumulatedText).trim();
      if (finalCleanedText) {
        setReportData(buildCaseReportData(finalCleanedText));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mindmap-app-layout">
      <aside className="control-panel">
        <div className="panel-header">
          <h1>
            <span aria-hidden="true">[ ]</span> AI Investigator
          </h1>
          <p>Generate procedural mind maps from case files or crime types.</p>
        </div>

        <div className="panel-section">
          <h2>
            <span aria-hidden="true">01</span> Input Source
          </h2>
          <div className="input-selector">
            <button
              onClick={() => setInputType("text")}
              className={inputType === "text" ? "active" : ""}
            >
              Text
            </button>
            <button
              onClick={() => setInputType("pdf")}
              className={inputType === "pdf" ? "active" : ""}
            >
              PDF
            </button>
            <button
              onClick={() => setInputType("image")}
              className={inputType === "image" ? "active" : ""}
            >
              Image
            </button>
          </div>
        </div>

        <div className="panel-section">
          <h2>
            <span aria-hidden="true">02</span> Provide Data
          </h2>
          {inputType === "text" ? (
            <textarea
              className="text-input"
              placeholder="Enter crime type or paste report..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          ) : (
            <div className="file-upload-wrapper">
              <label htmlFor="file-upload" className="file-upload-label">
                <span>
                  {fileName || `Choose a ${inputType.toUpperCase()} file...`}
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept={inputType === "pdf" ? ".pdf" : "image/*"}
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="panel-footer">
          <button
            onClick={generateMindMap}
            disabled={isLoading}
            className="generate-button"
          >
            {isLoading ? (
              <>
                Generating...
              </>
            ) : (
              <>
                Generate Mind Map
              </>
            )}
          </button>

          <button
            onClick={downloadReport}
            disabled={!reportData || isLoading}
            className="download-button"
            type="button"
          >
            Download PDF Report
          </button>
        </div>
      </aside>

      <main className="mindmap-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background variant="dots" gap={16} size={1} />
        </ReactFlow>
      </main>
    </div>
  );
}

