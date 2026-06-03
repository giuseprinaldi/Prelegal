import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AuthMode } from "./types";

interface AuthModalProps {
  authMode: AuthMode;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  authUsername: string;
  setAuthUsername: Dispatch<SetStateAction<string>>;
  authPassword: string;
  setAuthPassword: Dispatch<SetStateAction<string>>;
  authError: string;
  setAuthError: Dispatch<SetStateAction<string>>;
  handleAuthSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export default function AuthModal({
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  handleAuthSubmit,
  onClose,
}: AuthModalProps) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "var(--bg-sidebar)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "2rem",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)"
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          color: "var(--text-primary)",
          textAlign: "center"
        }}>
          {authMode === "login" ? "Sign In to Prelegal" : "Create Account"}
        </h3>

        <form onSubmit={handleAuthSubmit}>
          {authError && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#f87171",
              padding: "0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              {authError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="authUsername">Username</label>
            <input
              type="text"
              id="authUsername"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="e.g. janesmith"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="authPassword">Password</label>
            <input
              type="password"
              id="authPassword"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "var(--text-primary)"
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--purple-btn)", // Purple Secondary
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "1rem",
              transition: "all 0.2s"
            }}
          >
            {authMode === "login" ? "Sign In" : "Register & Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {authMode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 500 }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setAuthMode("login"); setAuthError(""); }}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 500 }}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.85rem",
            marginTop: "1.5rem",
            textDecoration: "underline"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
