import type { Dispatch, SetStateAction } from "react";
import type { AuthMode, SavedDocument, Template } from "./types";

interface HeaderProps {
  templatesList: Template[];
  user: { username: string } | null;
  savedDocs: SavedDocument[];
  currentDocId: number | null;
  saveStatus: string;
  autofillSample: () => void;
  clearForm: () => void;
  downloadMarkdownFile: () => void;
  handlePrint: () => void;
  handleSaveDocument: () => void;
  handleLogout: () => void;
  handleLoadDocument: (doc: SavedDocument) => void;
  handleDeleteDocument: (docId: number) => void;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  setAuthError: Dispatch<SetStateAction<string>>;
  setShowAuthModal: Dispatch<SetStateAction<boolean>>;
}

export default function Header({
  templatesList,
  user,
  savedDocs,
  currentDocId,
  saveStatus,
  autofillSample,
  clearForm,
  downloadMarkdownFile,
  handlePrint,
  handleSaveDocument,
  handleLogout,
  handleLoadDocument,
  handleDeleteDocument,
  setAuthMode,
  setAuthError,
  setShowAuthModal,
}: HeaderProps) {
  return (
    <header className="no-print" style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 2rem",
      borderBottom: "1px solid var(--border-color)",
      background: "rgba(3, 33, 71, 0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "1.25rem",
          color: "#ffffff",
          boxShadow: "0 0 15px rgba(32, 157, 215, 0.4)"
        }}>
          P
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>
            Prelegal
          </h1>
          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0 }}>
            SaaS Document Drafter | Supported templates: {templatesList.length}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={autofillSample}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 500,
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          Auto-Fill Sample
        </button>
        <button
          onClick={clearForm}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            background: "rgba(239, 68, 68, 0.05)",
            color: "#f87171",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 500,
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)"}
        >
          Clear Form
        </button>
        <button
          onClick={downloadMarkdownFile}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(32, 157, 215, 0.2)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Markdown
        </button>
        <button
          onClick={handlePrint}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid var(--primary)",
            background: "rgba(32, 157, 215, 0.1)",
            color: "#93c5fd",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(32, 157, 215, 0.2)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(32, 157, 215, 0.1)"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print / PDF
        </button>

        {/* Database Persistence Integration */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderLeft: "1px solid var(--border-color)", paddingLeft: "0.75rem" }}>
          {user ? (
            <>
              {savedDocs.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const doc = savedDocs.find(d => d.id === parseInt(e.target.value));
                        if (doc) handleLoadDocument(doc);
                      }
                    }}
                    value={currentDocId || ""}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "6px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                      width: "160px"
                    }}
                  >
                    <option value="">Load Document...</option>
                    {savedDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                  {currentDocId && (
                    <button
                      onClick={() => handleDeleteDocument(currentDocId)}
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        borderRadius: "6px",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      title="Delete Document"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleSaveDocument}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--accent)", // Yellow Accent
                  color: "#0f172a",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
              >
                {saveStatus || "Save to DB"}
              </button>

              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>Logged in as <strong>{user.username}</strong></span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    textDecoration: "underline"
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveDocument}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px dashed var(--border-color)",
                  background: "rgba(255,255,255,0.02)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              >
                Save to DB
              </button>
              <button
                onClick={() => { setAuthMode("login"); setAuthError(""); setShowAuthModal(true); }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid var(--primary)",
                  background: "transparent",
                  color: "#93c5fd",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(32, 157, 215, 0.1)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setAuthError(""); setShowAuthModal(true); }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--purple-btn)", // Purple Secondary
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
