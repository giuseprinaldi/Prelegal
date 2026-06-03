import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AuthMode } from "./types";

interface LandingPageProps {
  authMode: AuthMode;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  authUsername: string;
  setAuthUsername: Dispatch<SetStateAction<string>>;
  authPassword: string;
  setAuthPassword: Dispatch<SetStateAction<string>>;
  authError: string;
  setAuthError: Dispatch<SetStateAction<string>>;
  handleAuthSubmit: (e: FormEvent) => void;
  onEnterGuest: () => void;
}

export default function LandingPage({
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  handleAuthSubmit,
  onEnterGuest,
}: LandingPageProps) {
  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      background: "var(--bg-app)"
    }}>
      {/* Left Side: Branding, Features & Legal Disclaimer */}
      <div style={{
        flex: "0 0 45%",
        background: "linear-gradient(145deg, var(--bg-sidebar) 0%, #02132a 100%)",
        borderRight: "1px solid var(--border-color)",
        padding: "3rem 4rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#ffffff"
      }}>
        {/* Top Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "3rem" }}>
            <div style={{
              background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "1.5rem",
              boxShadow: "0 0 20px rgba(32, 157, 215, 0.4)"
            }}>
              P
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "0.02em" }}>
                Prelegal
              </h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
                Automated Legal Document Architect
              </p>
            </div>
          </div>

          {/* Intro text */}
          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #ffffff 30%, var(--primary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Draft legal contracts dynamically with AI
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.5 }}>
              Prelegal helps startups and businesses generate customized, professional legal agreements in real-time, utilizing dynamic templates and conversational AI guides.
            </p>
          </div>

          {/* Features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={{ color: "var(--primary)", fontSize: "1.25rem", fontWeight: "bold" }}>✓</span>
              <div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>AI-Guided Drafting Dialogues</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>Have a simple conversation to fill in variables and explain complex legal terms.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={{ color: "var(--primary)", fontSize: "1.25rem", fontWeight: "bold" }}>✓</span>
              <div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>12 Supported Template Types</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>NDAs, SaaS, SLAs, DPAs, AI Addendums, Pilot Agreements and more.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={{ color: "var(--primary)", fontSize: "1.25rem", fontWeight: "bold" }}>✓</span>
              <div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>Real-Time Live HTML Previews</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>Instantly view populated fields highlighted in accent yellow or filled-in blue.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div style={{
          background: "rgba(236, 173, 10, 0.05)",
          border: "1px solid rgba(236, 173, 10, 0.15)",
          borderRadius: "8px",
          padding: "1rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start"
        }}>
          <span style={{ fontSize: "1.2rem", marginTop: "-0.2rem" }}>⚖️</span>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.4" }}>
            <strong>Important Legal Disclaimer:</strong> Prelegal is a template automation tool. All output documents must be considered drafts and should be reviewed by qualified legal counsel. Prelegal does not provide legal advice.
          </div>
        </div>
      </div>

      {/* Right Side: Auth Card & Guest Entry */}
      <div style={{
        flex: "0 0 55%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--bg-app)"
      }}>
        <div style={{
          background: "var(--bg-sidebar)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          padding: "2.5rem 3rem",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)"
        }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            textAlign: "center",
            color: "var(--text-primary)"
          }}>
            {authMode === "login" ? "Welcome Back" : "Create Account"}
          </h3>
          <p style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: "2rem"
          }}>
            {authMode === "login" ? "Sign in to access your saved legal documents" : "Register to start creating and saving documents"}
          </p>

          <form onSubmit={handleAuthSubmit}>
            {authError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
                textAlign: "center"
              }}>
                {authError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="landingUsername">Username</label>
              <input
                type="text"
                id="landingUsername"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="e.g. janesmith"
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid var(--border-color)",
                  color: "#ffffff"
                }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label htmlFor="landingPassword">Password</label>
              <input
                type="password"
                id="landingPassword"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid var(--border-color)",
                  color: "#ffffff",
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px"
                }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--purple-btn)", // Purple Secondary
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: 600,
                transition: "all 0.2s"
              }}
            >
              {authMode === "login" ? "Sign In" : "Register & Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: "0.85rem", marginTop: "1.25rem", color: "var(--text-secondary)" }}>
            {authMode === "login" ? (
              <>
                New to Prelegal?{" "}
                <button
                  onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                  style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setAuthMode("login"); setAuthError(""); }}
                  style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            margin: "2rem 0",
            color: "var(--text-secondary)",
            fontSize: "0.8rem"
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
            <span style={{ padding: "0 0.75rem" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
          </div>

          {/* Guest Sandbox Button */}
          <button
            onClick={onEnterGuest}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px dashed var(--primary)",
              background: "rgba(32, 157, 215, 0.05)",
              color: "#93c5fd",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(32, 157, 215, 0.12)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(32, 157, 215, 0.05)"}
          >
            Try Sandbox (Guest Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
