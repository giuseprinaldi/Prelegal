"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { marked } from "marked";

import type { AuthMode, Message, SavedDocument, Template } from "./components/types";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import Header from "./components/Header";
import ChatPanel from "./components/ChatPanel";
import FieldsForm from "./components/FieldsForm";
import DocumentPreview from "./components/DocumentPreview";

const API_BASE = typeof window !== "undefined" && window.location.port === "3000"
  ? "http://localhost:8000"
  : "";

export default function Home() {
  // Catalog & Template State
  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Auth and Document states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [currentDocId, setCurrentDocId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  // Chat Guide state
  const [sidebarTab, setSidebarTab] = useState<"chat" | "fields">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your Prelegal AI assistant. Tell me what type of legal agreement you would like to draft today, or choose a template from the dropdown above to get started!"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Ref for the sentinel element at the bottom of the chat list
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or loading indicator appears/disappears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Helper to initialize form data placeholders
  const getInitialFormData = useCallback((placeholders: string[]) => {
    const data: Record<string, string> = {};
    const today = new Date().toISOString().split("T")[0];
    placeholders.forEach((placeholder) => {
      if (placeholder.toLowerCase().includes("date")) {
        data[placeholder] = today;
      } else {
        data[placeholder] = "";
      }
    });
    return data;
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("prelegal_token");
    setToken(null);
    setUser(null);
    setSavedDocs([]);
    setCurrentDocId(null);
    setGuestMode(false);
  }, []);

  const fetchDocuments = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const docs = await res.json();
        setSavedDocs(docs);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }, []);

  const fetchUserProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        fetchDocuments(authToken);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      handleLogout();
    }
  }, [fetchDocuments, handleLogout]);

  // Switch template active document and initialize variables
  const handleSwitchTemplate = useCallback((templateName: string, loadedVariables?: Record<string, string>) => {
    const template = templatesList.find((t) => t.name === templateName);
    if (!template) return;

    setSelectedDocName(templateName);
    setSelectedTemplate(template);

    if (loadedVariables) {
      const initial = getInitialFormData(template.placeholders);
      setFormData({ ...initial, ...loadedVariables });
    } else {
      setFormData(getInitialFormData(template.placeholders));
      setMessages([
        {
          role: "assistant",
          content: `Great! Let's draft the ${templateName} together. To get started, let's fill in some of the core fields. ${
            template.placeholders.length > 0
              ? `What is the value for '${template.placeholders[0]}'?`
              : "What is the name of the parties entering the agreement?"
          }`
        }
      ]);
    }
  }, [templatesList, getInitialFormData]);

  // 1. Fetch templates catalog on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/templates`);
        if (res.ok) {
          const data: Template[] = await res.json();
          setTemplatesList(data);
          if (data.length > 0) {
            const defaultTemp = data.find(t => t.name.includes("Mutual Non-Disclosure Agreement - Standard Terms")) || data[0];
            setSelectedDocName(defaultTemp.name);
            setSelectedTemplate(defaultTemp);
            setFormData(getInitialFormData(defaultTemp.placeholders));
          }
        }
      } catch (err) {
        console.error("Error loading templates:", err);
      }
    };

    loadTemplates();

    const storedToken = localStorage.getItem("prelegal_token");
    if (storedToken) {
      setTimeout(() => {
        setToken(storedToken);
        fetchUserProfile(storedToken);
      }, 0);
    }
  }, [fetchUserProfile, getInitialFormData]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "login" ? "login" : "signup";
    try {
      const res = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("prelegal_token", data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        setShowAuthModal(false);
        setAuthUsername("");
        setAuthPassword("");
        setGuestMode(false);
        fetchDocuments(data.access_token);
      } else {
        setAuthError(data.detail || "Authentication failed");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Network error occurred");
    }
  };

  const handleEnterGuest = () => {
    setGuestMode(true);
    setAuthError("");
    setAuthUsername("");
    setAuthPassword("");
  };

  const handleSaveDocument = async () => {
    if (!token) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }
    setSaveStatus("Saving...");

    const p1 = formData["Party 1"] || formData["Provider"] || formData["Company"] || "";
    const p2 = formData["Party 2"] || formData["Customer"] || formData["Partner"] || "";
    const title = p1 && p2
      ? `${p1} & ${p2} - ${selectedDocName}`
      : `${selectedDocName} (${new Date().toLocaleDateString()})`;

    const payload = {
      document_type: selectedDocName,
      title,
      variables: formData,
      content: generateMarkdownContent(),
    };

    try {
      const method = currentDocId ? "PUT" : "POST";
      const url = currentDocId
        ? `${API_BASE}/api/documents/${currentDocId}`
        : `${API_BASE}/api/documents`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedDoc = await res.json();
        setCurrentDocId(savedDoc.id);
        setSaveStatus("Saved!");
        fetchDocuments(token);
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Error saving");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("Error saving");
    }
  };

  const handleLoadDocument = (doc: SavedDocument) => {
    setCurrentDocId(doc.id);
    handleSwitchTemplate(doc.document_type, doc.variables);
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (currentDocId === docId) {
          setCurrentDocId(null);
        }
        fetchDocuments(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: Message = { role: "user", content: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputText,
          chat_history: messages.map((m) => ({ role: m.role, content: m.content })),
          selected_document_type: selectedDocName,
          current_variables: formData
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.assistant_message }]);

        if (data.selected_document_type && data.selected_document_type !== "None" && data.selected_document_type !== selectedDocName) {
          const targetTemp = templatesList.find(t => t.name === data.selected_document_type);
          if (targetTemp) {
            setSelectedDocName(targetTemp.name);
            setSelectedTemplate(targetTemp);
            setFormData(data.updated_variables);
            return;
          }
        }

        setFormData(data.updated_variables);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I couldn't reach the AI backend. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "A network error occurred. Please check your connection." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const autofillSample = () => {
    if (!selectedTemplate) return;
    const sampleData: Record<string, string> = {};
    const sampleValues: Record<string, string> = {
      "provider": "Acme Services Inc.",
      "customer": "Global Corp",
      "company": "Prelegal Technologies Inc.",
      "partner": "Alpha Partnerships LLC",
      "effective date": new Date().toISOString().split("T")[0],
      "order date": new Date().toISOString().split("T")[0],
      "baa effective date": new Date().toISOString().split("T")[0],
      "end date": new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
      "governing law": "Delaware",
      "chosen courts": "courts located in Wilmington, Delaware",
      "jurisdiction": "courts located in Wilmington, Delaware",
      "general cap amount": "$10,000",
      "notice address": "123 Legal Lane, Suite 100, Wilmington, DE 19801",
      "technical support": "Email support at support@acme.com with 24-hour response time.",
      "subscription period": "1 Year",
      "subscription periods": "1 Year",
      "uptime credit": "10% of monthly fee if uptime falls below 99.9%",
      "target response time": "4 hours",
      "target uptime": "99.9%",
      "support channel": "support@acme.com",
      "response time credit": "5% of monthly fee if response time target missed",
      "scheduled downtime": "Sundays 2:00 AM - 4:00 AM EST",
      "fees": "$5,000 per year",
      "dpa": "Standard GDPR DPA",
      "term": "1 Year",
      "pilot period": "30 days",
      "license limits": "Up to 50 concurrent users",
      "warranty period": "90 days",
      "deletion procedure": "Secure overwrite followed by deletion certificate within 30 days",
      "nature and purpose of processing": "Hosting and service optimization",
      "duration of processing": "For the duration of the cloud service subscription",
      "categories of data subjects": "Employees and customers of the client",
      "categories of personal data": "Names, emails, and usage metadata",
      "frequency of transfer": "Continuous",
      "governing member state": "Ireland",
      "provider security contact": "security@acme.com",
      "security policy": "ISO 27001 certified",
      "duration": "5 Years",
      "modifications": "None."
    };

    selectedTemplate.placeholders.forEach((p) => {
      const lowerP = p.toLowerCase();
      let foundVal = "";
      for (const [k, v] of Object.entries(sampleValues)) {
        if (lowerP === k || lowerP.includes(k)) {
          foundVal = v;
          break;
        }
      }
      sampleData[p] = foundVal || `Sample ${p}`;
    });
    setFormData(sampleData);
  };

  const clearForm = () => {
    if (!selectedTemplate) return;
    setFormData(getInitialFormData(selectedTemplate.placeholders));
  };

  const generateMarkdownContent = () => {
    if (!selectedTemplate) return "";
    let text = selectedTemplate.content || "";

    selectedTemplate.placeholders.forEach((placeholder) => {
      const val = formData[placeholder] || "";
      const spanRegex = new RegExp(`<span\\s+[^>]*class=["\'][^"\']+["\'][^>]*>${placeholder}</span>`, "gi");
      text = text.replace(spanRegex, val || `[${placeholder}]`);

      const bracketRegex = new RegExp(`\\[${placeholder}\\]`, "gi");
      text = text.replace(bracketRegex, val || `[${placeholder}]`);
    });
    return text;
  };

  const getRenderedHtml = (): string => {
    if (!selectedTemplate) return "";
    let text = selectedTemplate.content || "";

    selectedTemplate.placeholders.forEach((placeholder) => {
      const val = formData[placeholder] || "";
      const displayVal = val
        ? `<span class="filled-variable">${val}</span>`
        : `<span class="highlight-field">[${placeholder}]</span>`;

      const spanRegex = new RegExp(`<span\\s+[^>]*class=["\'][^"\']+["\'][^>]*>${placeholder}</span>`, "gi");
      text = text.replace(spanRegex, displayVal);

      const bracketRegex = new RegExp(`\\[${placeholder}\\]`, "gi");
      text = text.replace(bracketRegex, val ? `<span class="filled-variable">${val}</span>` : `<span class="highlight-field">[${placeholder}]</span>`);
    });

    try {
      return marked.parse(text) as string;
    } catch (e) {
      console.error(e);
      return text;
    }
  };

  const downloadMarkdownFile = () => {
    const content = generateMarkdownContent();
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanDocName = selectedDocName.toLowerCase().replace(/[^a-z0-9]/gi, "_");
    link.setAttribute("download", `draft_${cleanDocName}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!token && !guestMode) {
    return (
      <LandingPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authUsername={authUsername}
        setAuthUsername={setAuthUsername}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        handleAuthSubmit={handleAuthSubmit}
        onEnterGuest={handleEnterGuest}
      />
    );
  }

  return (
    <div className="app-container" style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-app)" }}>
      <Header
        templatesList={templatesList}
        user={user}
        savedDocs={savedDocs}
        currentDocId={currentDocId}
        saveStatus={saveStatus}
        autofillSample={autofillSample}
        clearForm={clearForm}
        downloadMarkdownFile={downloadMarkdownFile}
        handlePrint={handlePrint}
        handleSaveDocument={handleSaveDocument}
        handleLogout={handleLogout}
        handleLoadDocument={handleLoadDocument}
        handleDeleteDocument={handleDeleteDocument}
        setAuthMode={setAuthMode}
        setAuthError={setAuthError}
        setShowAuthModal={setShowAuthModal}
      />

      {/* Main Workspace Area (2 columns: Inputs & Live Preview) */}
      <div className="split-pane" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left Column: Form Settings (Scrollable) */}
        <aside className="no-print" style={{
          width: "480px",
          borderRight: "1px solid var(--border-color)",
          background: "var(--bg-sidebar)",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>

          {/* Agreement Selection Dropdown */}
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", background: "rgba(1, 12, 30, 0.4)" }}>
            <label htmlFor="doc-selector" style={{ marginBottom: "0.4rem" }}>Agreement Template</label>
            <select
              id="doc-selector"
              value={selectedDocName}
              onChange={(e) => handleSwitchTemplate(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                background: "rgba(15, 23, 42, 0.8)",
                color: "var(--text-primary)",
                fontSize: "0.9rem"
              }}
            >
              <option value="" disabled>Select a template...</option>
              {templatesList.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem", fontStyle: "italic", lineHeight: "1.3" }}>
              {selectedTemplate?.description}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border-color)",
            background: "rgba(1, 12, 30, 0.2)"
          }}>
            <button
              onClick={() => setSidebarTab("chat")}
              style={{
                flex: 1,
                padding: "1rem",
                background: sidebarTab === "chat" ? "rgba(255, 255, 255, 0.03)" : "transparent",
                border: "none",
                borderBottom: sidebarTab === "chat" ? "2px solid var(--primary)" : "2px solid transparent",
                color: sidebarTab === "chat" ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              AI Drafting Chat
            </button>
            <button
              onClick={() => setSidebarTab("fields")}
              style={{
                flex: 1,
                padding: "1rem",
                background: sidebarTab === "fields" ? "rgba(255, 255, 255, 0.03)" : "transparent",
                border: "none",
                borderBottom: sidebarTab === "fields" ? "2px solid var(--primary)" : "2px solid transparent",
                color: sidebarTab === "fields" ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
              </svg>
              Manual Variables
            </button>
          </div>

          {/* Tab Content */}
          {sidebarTab === "chat" ? (
            <ChatPanel
              messages={messages}
              isChatLoading={isChatLoading}
              inputText={inputText}
              setInputText={setInputText}
              handleSendMessage={handleSendMessage}
              selectedDocName={selectedDocName}
              messagesEndRef={messagesEndRef}
            />
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                </svg>
                Agreement Variables
              </h2>
              <FieldsForm
                selectedTemplate={selectedTemplate}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          )}

          {/* Persistent Disclaimer */}
          <div className="no-print" style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--border-color)",
            background: "rgba(236, 173, 10, 0.03)",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            flexShrink: 0
          }}>
            <span style={{ color: "var(--accent)", fontSize: "1.1rem", marginTop: "-0.1rem" }}>⚠️</span>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              <strong>Disclaimer:</strong> All generated documents are drafts and subject to legal review. Prelegal does not provide legal advice.
            </div>
          </div>
        </aside>

        {/* Right Column: Live Document Preview */}
        <DocumentPreview
          selectedDocName={selectedDocName}
          selectedTemplate={selectedTemplate}
          renderedHtml={getRenderedHtml()}
        />

      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal
          authMode={authMode}
          setAuthMode={setAuthMode}
          authUsername={authUsername}
          setAuthUsername={setAuthUsername}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authError={authError}
          setAuthError={setAuthError}
          handleAuthSubmit={handleAuthSubmit}
          onClose={() => { setShowAuthModal(false); setAuthError(""); }}
        />
      )}
    </div>
  );
}
