"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { marked } from "marked";

interface Template {
  name: string;
  description: string;
  filename: string;
  placeholders: string[];
  content: string;
}

interface SavedDocument {
  id: number;
  title: string;
  document_type: string;
  variables: Record<string, string>;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

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
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
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

  const getRenderedHtml = () => {
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
      return marked.parse(text);
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

  const renderDynamicForm = () => {
    if (!selectedTemplate || !selectedTemplate.placeholders) return null;
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {selectedTemplate.placeholders.map((placeholder: string) => {
          const lowerName = placeholder.toLowerCase();
          const isDate = lowerName.includes("date");
          const isTextArea = lowerName.includes("description") || 
                             lowerName.includes("policy") || 
                             lowerName.includes("restrictions") || 
                             lowerName.includes("obligations") || 
                             lowerName.includes("warranties") || 
                             lowerName.includes("limitations") ||
                             lowerName.includes("address") ||
                             lowerName.includes("purpose") ||
                             placeholder.length > 25;
                             
          return (
            <div className="form-group" key={placeholder}>
              <label htmlFor={`field-${placeholder}`}>{placeholder}</label>
              {isTextArea ? (
                <textarea
                  id={`field-${placeholder}`}
                  name={placeholder}
                  rows={3}
                  value={formData[placeholder] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, [placeholder]: e.target.value }))}
                  placeholder={`Enter ${placeholder}...`}
                />
              ) : (
                <input
                  type={isDate ? "date" : "text"}
                  id={`field-${placeholder}`}
                  name={placeholder}
                  value={formData[placeholder] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, [placeholder]: e.target.value }))}
                  placeholder={`Enter ${placeholder}...`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderLandingPage = () => {
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
              onClick={() => {
                setGuestMode(true);
                setAuthError("");
                setAuthUsername("");
                setAuthPassword("");
              }}
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
  };

  if (!token && !guestMode) {
    return renderLandingPage();
  }

  return (
    <div className="app-container" style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-app)" }}>
      {/* Top Header */}
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
              {renderDynamicForm()}
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
                  dangerouslySetInnerHTML={{ __html: getRenderedHtml() }} 
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

      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
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
              onClick={() => { setShowAuthModal(false); setAuthError(""); }}
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
      )}
    </div>
  );
}
