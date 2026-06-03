import type { Template } from "./types";

interface DocumentPreviewProps {
  selectedDocName: string;
  selectedTemplate: Template | null;
  renderedHtml: string;
}

export default function DocumentPreview({ selectedDocName, selectedTemplate, renderedHtml }: DocumentPreviewProps) {
  return (
    <main className="preview-panel" style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "#0d1527",
      height: "100%",
      position: "relative"
    }}>
      {/* Header toolbar */}
      <div className="no-print" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(17, 24, 39, 0.6)"
      }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
          {selectedDocName}
        </div>

        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Live Document Preview (Real-time updates)
        </div>
      </div>

      {/* Paper View Container */}
      <div className="paper-container">
        <div className="paper-page">
          {selectedTemplate ? (
            <div
              className="rendered-markdown"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
              Please select a template to preview.
            </div>
          )}
        </div>

        {/* Disclaimer in preview footer */}
        <div className="no-print" style={{
          maxWidth: "850px",
          width: "100%",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          padding: "1.25rem",
          borderTop: "1px dashed var(--border-color)",
          marginTop: "0.5rem",
          marginBottom: "1.5rem",
          background: "rgba(3, 33, 71, 0.2)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem"
        }}>
          <span>⚖️</span>
          <span><strong>Legal Notice:</strong> All documents generated are draft templates subject to professional legal review.</span>
        </div>
      </div>
    </main>
  );
}
