import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import type { Message } from "./types";

interface ChatPanelProps {
  messages: Message[];
  isChatLoading: boolean;
  inputText: string;
  setInputText: Dispatch<SetStateAction<string>>;
  handleSendMessage: (e: FormEvent) => void;
  selectedDocName: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function ChatPanel({
  messages,
  isChatLoading,
  inputText,
  setInputText,
  handleSendMessage,
  selectedDocName,
  messagesEndRef,
}: ChatPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", padding: "1.25rem" }}>
      {/* Chat Messages Log */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        paddingRight: "0.25rem"
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: msg.role === "user" ? "linear-gradient(135deg, var(--primary), #8b5cf6)" : "rgba(255, 255, 255, 0.05)",
              border: msg.role === "user" ? "none" : "1px solid var(--border-color)",
              color: "#ffffff",
              borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              padding: "0.75rem 1rem",
              fontSize: "0.9rem",
              lineHeight: "1.4",
              boxShadow: msg.role === "user" ? "0 4px 10px rgba(32, 157, 215, 0.2)" : "none",
              whiteSpace: "pre-wrap"
            }}
          >
            {msg.content}
          </div>
        ))}
        {isChatLoading && (
          <div style={{
            alignSelf: "flex-start",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            borderRadius: "12px 12px 12px 2px",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span className="dot-loading" style={{ animationDelay: "0s" }}>•</span>
            <span className="dot-loading" style={{ animationDelay: "0.2s" }}>•</span>
            <span className="dot-loading" style={{ animationDelay: "0.4s" }}>•</span>
            <span>AI is drafting...</span>
          </div>
        )}
        {/* Sentinel element — always scrolled into view after updates */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask AI about the ${selectedDocName}...`}
          disabled={isChatLoading}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#ffffff",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={isChatLoading || !inputText.trim()}
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            background: "var(--purple-btn)", // Purple Secondary
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
            transition: "all 0.2s",
            opacity: (isChatLoading || !inputText.trim()) ? 0.6 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
