"use client";

import { useState, useEffect } from "react";

interface NDAFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: "expires" | "continues";
  mndaTermExpiresYears: string;
  confidentialityTermType: "duration" | "perpetuity";
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;

  party1Name: string;
  party1Title: string;
  party1Company: string;
  party1Address: string;
  party1Date: string;
  party1Signature: string;

  party2Name: string;
  party2Title: string;
  party2Company: string;
  party2Address: string;
  party2Date: string;
  party2Signature: string;
}

const defaultData: NDAFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTermType: "expires",
  mndaTermExpiresYears: "1",
  confidentialityTermType: "duration",
  confidentialityTermYears: "5",
  governingLaw: "Delaware",
  jurisdiction: "courts located in New Castle County, Delaware",
  modifications: "None.",

  party1Company: "Acme Corporation",
  party1Name: "Jane Doe",
  party1Title: "CEO",
  party1Address: "123 Innovation Way, Wilmington, DE 19801",
  party1Date: new Date().toISOString().split("T")[0],
  party1Signature: "Jane Doe",

  party2Company: "Beta Industries",
  party2Name: "John Smith",
  party2Title: "CTO",
  party2Address: "456 Technology Blvd, San Francisco, CA 94105",
  party2Date: new Date().toISOString().split("T")[0],
  party2Signature: "John Smith",
};

export default function Home() {
  const [formData, setFormData] = useState<NDAFormData>(defaultData);
  const [activeTab, setActiveTab] = useState<"cover" | "terms" | "full">("full");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const autofillSample = () => {
    setFormData(defaultData);
  };

  const clearForm = () => {
    setFormData({
      purpose: "",
      effectiveDate: "",
      mndaTermType: "expires",
      mndaTermExpiresYears: "1",
      confidentialityTermType: "duration",
      confidentialityTermYears: "1",
      governingLaw: "",
      jurisdiction: "",
      modifications: "None.",
      party1Company: "",
      party1Name: "",
      party1Title: "",
      party1Address: "",
      party1Date: "",
      party1Signature: "",
      party2Company: "",
      party2Name: "",
      party2Title: "",
      party2Address: "",
      party2Date: "",
      party2Signature: "",
    });
  };

  const getMNDATermText = () => {
    if (formData.mndaTermType === "expires") {
      return `Expires ${formData.mndaTermExpiresYears || "1"} year(s) from Effective Date.`;
    }
    return "Continues until terminated in accordance with the terms of the MNDA.";
  };

  const getConfidentialityTermText = () => {
    if (formData.confidentialityTermType === "duration") {
      return `${formData.confidentialityTermYears || "5"} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`;
    }
    return "In perpetuity.";
  };

  const generateMarkdownContent = () => {
    return `# Mutual Non-Disclosure Agreement

## Cover Page

This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 identical to those posted at commonpaper.com/standards/mutual-nda/1.0.

### Purpose
${formData.purpose || "[Purpose not specified]"}

### Effective Date
${formData.effectiveDate || "[Effective Date not specified]"}

### MNDA Term
${getMNDATermText()}

### Term of Confidentiality
${getConfidentialityTermText()}

### Governing Law & Jurisdiction
Governing Law: State of ${formData.governingLaw || "[State not specified]"}
Jurisdiction: ${formData.jurisdiction || "[Jurisdiction not specified]"}

### MNDA Modifications
${formData.modifications || "None."}

By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.

| Field | PARTY 1 | PARTY 2 |
| :--- | :--- | :--- |
| **Company** | ${formData.party1Company || "-"} | ${formData.party2Company || "-"} |
| **Signature** | ${formData.party1Signature || "-"} | ${formData.party2Signature || "-"} |
| **Print Name** | ${formData.party1Name || "-"} | ${formData.party2Name || "-"} |
| **Title** | ${formData.party1Title || "-"} | ${formData.party2Title || "-"} |
| **Notice Address** | ${formData.party1Address || "-"} | ${formData.party2Address || "-"} |
| **Date** | ${formData.party1Date || "-"} | ${formData.party2Date || "-"} |

---

# Standard Terms

1. **Introduction**. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection with the Purpose which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.

2. **Use and Protection of Confidential Information**. The Receiving Party shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the Purpose, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.

3. **Exceptions**. The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.

4. **Disclosures Required by Law**. The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.

5. **Term and Termination**. This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the Term of Confidentiality, despite any expiration or termination of this MNDA.

6. **Return or Destruction of Confidential Information**. Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.

7. **Proprietary Rights**. The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.

8. **Disclaimer**. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

9. **Governing Law and Jurisdiction**. This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ${formData.governingLaw || "Delaware"}, without regard to the conflict of laws provisions of such State. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ${formData.jurisdiction || "New Castle County, Delaware"}. Each party irrevocably submits to the exclusive jurisdiction of such courts in any such suit, action, or proceeding.

10. **Equitable Relief**. A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.

11. **General**. Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.

---
Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
`;
  };

  const downloadMarkdownFile = () => {
    const content = generateMarkdownContent();
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const p1 = formData.party1Company.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "party1";
    const p2 = formData.party2Company.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "party2";
    link.setAttribute("download", `mnda_${p1}_vs_${p2}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderCoverPage = () => (
    <div>
      <h1>Mutual Non-Disclosure Agreement</h1>
      
      <h3>Using This Mutual Non-Disclosure Agreement</h3>
      <p style={{ fontSize: "0.9rem", color: "#64748b", fontStyle: "italic", marginBottom: "2rem" }}>
        This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“Cover Page”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 (“Standard Terms”) identical to those posted at commonpaper.com/standards/mutual-nda/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.
      </p>

      <h3>Purpose</h3>
      <p style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>
        How Confidential Information may be used
      </p>
      <p style={{ fontWeight: 500, backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "4px", borderLeft: "4px solid #6366f1" }}>
        {formData.purpose ? formData.purpose : <span className="highlight-field">Fill in Purpose</span>}
      </p>

      <h3>Effective Date</h3>
      <p style={{ fontWeight: 500, backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "4px", borderLeft: "4px solid #6366f1" }}>
        {formData.effectiveDate ? formData.effectiveDate : <span className="highlight-field">Select Date</span>}
      </p>

      <h3>MNDA Term</h3>
      <p style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>
        The length of this MNDA
      </p>
      <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "4px", borderLeft: "4px solid #6366f1" }}>
        {formData.mndaTermType === "expires" ? (
          <div>
            <span style={{ marginRight: "0.5rem", fontWeight: "bold" }}>[✓]</span>
            Expires <span style={{ fontWeight: 600 }}>{formData.mndaTermExpiresYears || 1} year(s)</span> from Effective Date.
          </div>
        ) : (
          <div>
            <span style={{ marginRight: "0.5rem", fontWeight: "bold" }}>[✓]</span>
            Continues until terminated in accordance with the terms of the MNDA.
          </div>
        )}
      </div>

      <h3>Term of Confidentiality</h3>
      <p style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>
        How long Confidential Information is protected
      </p>
      <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "4px", borderLeft: "4px solid #6366f1" }}>
        {formData.confidentialityTermType === "duration" ? (
          <div>
            <span style={{ marginRight: "0.5rem", fontWeight: "bold" }}>[✓]</span>
            <span style={{ fontWeight: 600 }}>{formData.confidentialityTermYears || 5} year(s)</span> from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.
          </div>
        ) : (
          <div>
            <span style={{ marginRight: "0.5rem", fontWeight: "bold" }}>[✓]</span>
            In perpetuity.
          </div>
        )}
      </div>

      <h3>Governing Law & Jurisdiction</h3>
      <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "4px", borderLeft: "4px solid #6366f1", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0 }}>
          <strong>Governing Law:</strong> State of {formData.governingLaw ? formData.governingLaw : <span className="highlight-field">Fill in State</span>}
        </p>
        <p style={{ margin: "0.5rem 0 0 0" }}>
          <strong>Jurisdiction:</strong> {formData.jurisdiction ? formData.jurisdiction : <span className="highlight-field">Fill in Jurisdiction Court/City</span>}
        </p>
      </div>

      <h3>MNDA Modifications</h3>
      <p style={{ fontSize: "0.9rem", backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "4px", borderLeft: "4px solid #cbd5e1" }}>
        {formData.modifications || "None."}
      </p>

      <p style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.
      </p>

      <table>
        <thead>
          <tr>
            <th>FIELD</th>
            <th>PARTY 1</th>
            <th>PARTY 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Company</strong></td>
            <td>{formData.party1Company ? formData.party1Company : <span className="highlight-field">Required</span>}</td>
            <td>{formData.party2Company ? formData.party2Company : <span className="highlight-field">Required</span>}</td>
          </tr>
          <tr>
            <td><strong>Signature</strong></td>
            <td style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#1e3a8a" }}>
              {formData.party1Signature || ""}
            </td>
            <td style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#1e3a8a" }}>
              {formData.party2Signature || ""}
            </td>
          </tr>
          <tr>
            <td><strong>Print Name</strong></td>
            <td>{formData.party1Name || ""}</td>
            <td>{formData.party2Name || ""}</td>
          </tr>
          <tr>
            <td><strong>Title</strong></td>
            <td>{formData.party1Title || ""}</td>
            <td>{formData.party2Title || ""}</td>
          </tr>
          <tr>
            <td><strong>Notice Address</strong></td>
            <td style={{ fontSize: "0.8rem", whiteSpace: "pre-line" }}>{formData.party1Address || ""}</td>
            <td style={{ fontSize: "0.8rem", whiteSpace: "pre-line" }}>{formData.party2Address || ""}</td>
          </tr>
          <tr>
            <td><strong>Date</strong></td>
            <td>{formData.party1Date || ""}</td>
            <td>{formData.party2Date || ""}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", marginTop: "3rem" }}>
        Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.
      </p>
    </div>
  );

  const renderStandardTerms = () => (
    <div>
      <h1>Standard Terms</h1>
      
      <p>
        <strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) (“<strong>MNDA</strong>”) allows each party (“<strong>Disclosing Party</strong>”) to disclose or make available information in connection with the <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.purpose || "Purpose"}</span> which (1) the Disclosing Party identifies to the receiving party (“<strong>Receiving Party</strong>”) as “confidential”, “proprietary”, or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure (“<strong>Confidential Information</strong>”). Each party’s Confidential Information also includes the existence and status of the parties’ discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms (“<strong>Cover Page</strong>”). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.
      </p>

      <p>
        <strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.purpose || "Purpose"}</span>; (b) not disclose Confidential Information to third parties without the Disclosing Party’s prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.purpose || "Purpose"}</span>, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.
      </p>

      <p>
        <strong>3. Exceptions.</strong> The Receiving Party’s obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.
      </p>

      <p>
        <strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party’s expense, with the Disclosing Party’s efforts to obtain confidential treatment for the Confidential Information.
      </p>

      <p>
        <strong>5. Term and Termination.</strong> This MNDA commences on the <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.effectiveDate || "Effective Date"}</span> and expires at the end of the <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.mndaTermType === "expires" ? `${formData.mndaTermExpiresYears} Year(s) from Effective Date` : "MNDA Term"}</span>. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party’s obligations relating to Confidential Information will survive for the <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.confidentialityTermType === "duration" ? `${formData.confidentialityTermYears} Year(s) from Effective Date` : "Confidentiality Term"}</span>, despite any expiration or termination of this MNDA.
      </p>

      <p>
        <strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this MNDA or upon the Disclosing Party’s earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party’s written request, destroy all Confidential Information in the Receiving Party’s possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.
      </p>

      <p>
        <strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.
      </p>

      <p>
        <strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED “AS IS”, WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
      </p>

      <p>
        <strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.governingLaw || "Delaware"}</span>, without regard to the conflict of laws provisions of such State. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in <span style={{ fontWeight: 600, borderBottom: "1px dashed #6366f1" }}>{formData.jurisdiction || "New Castle County, Delaware"}</span>. Each party irrevocably submits to the exclusive jurisdiction of such courts in any such suit, action, or proceeding.
      </p>

      <p>
        <strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.
      </p>

      <p>
        <strong>11. General.</strong> Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party’s permitted successors and assigns. Waivers must be signed by the waiving party’s authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.
      </p>
      
      <p style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", marginTop: "3rem" }}>
        Common Paper Mutual Non-Disclosure Agreement [Version 1.0](https://commonpaper.com/standards/mutual-nda/1.0/) free to use under CC BY 4.0.
      </p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-app)" }}>
      {/* Top Navigation / Header */}
      <header className="no-print" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "1.2rem",
            color: "#ffffff",
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
          }}>
            P
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>
              Prelegal
            </h1>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0 }}>
              Jira PL-3 Prototype | Mutual NDA Creator
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
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
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
              background: "rgba(99, 102, 241, 0.1)",
              color: "#a5b4fc",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print / PDF
          </button>
        </div>
      </header>

      {/* Main Workspace Area (2 columns: Inputs & Live Preview) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Column: Form Settings (Scrollable) */}
        <aside className="no-print" style={{
          width: "480px",
          borderRight: "1px solid var(--border-color)",
          background: "rgba(10, 15, 30, 0.5)",
          padding: "1.5rem",
          overflowY: "auto",
          height: "100%"
        }}>
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

          {/* Section 1: Agreement Info */}
          <div className="form-section">
            <div className="form-section-title">
              <span>1. Agreement Core Settings</span>
            </div>
            
            <div className="form-group">
              <label htmlFor="purpose">Purpose / Scope</label>
              <textarea
                id="purpose"
                name="purpose"
                rows={3}
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Why is Confidential Information being shared?"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="effectiveDate">Effective Date</label>
                <input
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>MNDA Term (Duration)</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="mndaTermType"
                    value="expires"
                    checked={formData.mndaTermType === "expires"}
                    onChange={() => setFormData(prev => ({ ...prev, mndaTermType: "expires" }))}
                  />
                  <span>Expires in years:</span>
                </label>
                {formData.mndaTermType === "expires" && (
                  <select
                    name="mndaTermExpiresYears"
                    value={formData.mndaTermExpiresYears}
                    onChange={handleInputChange}
                    style={{ marginLeft: "1.75rem", width: "calc(100% - 1.75rem)" }}
                  >
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years</option>
                  </select>
                )}

                <label className="radio-option">
                  <input
                    type="radio"
                    name="mndaTermType"
                    value="continues"
                    checked={formData.mndaTermType === "continues"}
                    onChange={() => setFormData(prev => ({ ...prev, mndaTermType: "continues" }))}
                  />
                  <span>Continues until terminated</span>
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Confidentiality protection term</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="confidentialityTermType"
                    value="duration"
                    checked={formData.confidentialityTermType === "duration"}
                    onChange={() => setFormData(prev => ({ ...prev, confidentialityTermType: "duration" }))}
                  />
                  <span>Protected for years:</span>
                </label>
                {formData.confidentialityTermType === "duration" && (
                  <select
                    name="confidentialityTermYears"
                    value={formData.confidentialityTermYears}
                    onChange={handleInputChange}
                    style={{ marginLeft: "1.75rem", width: "calc(100% - 1.75rem)" }}
                  >
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years</option>
                    <option value="7">7 Years</option>
                    <option value="10">10 Years</option>
                  </select>
                )}

                <label className="radio-option">
                  <input
                    type="radio"
                    name="confidentialityTermType"
                    value="perpetuity"
                    checked={formData.confidentialityTermType === "perpetuity"}
                    onChange={() => setFormData(prev => ({ ...prev, confidentialityTermType: "perpetuity" }))}
                  />
                  <span>In perpetuity</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Law & Modifications */}
          <div className="form-section">
            <div className="form-section-title">
              <span>2. Governing Law & Modifications</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="governingLaw">Governing Law (State)</label>
                <input
                  type="text"
                  id="governingLaw"
                  name="governingLaw"
                  value={formData.governingLaw}
                  onChange={handleInputChange}
                  placeholder="e.g. Delaware"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jurisdiction">Jurisdiction (Courts Location)</label>
              <input
                type="text"
                id="jurisdiction"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleInputChange}
                placeholder="e.g. courts located in New Castle County, Delaware"
              />
            </div>

            <div className="form-group">
              <label htmlFor="modifications">MNDA Modifications (Optional)</label>
              <textarea
                id="modifications"
                name="modifications"
                rows={2}
                value={formData.modifications}
                onChange={handleInputChange}
                placeholder="List any modifications to standard terms, or 'None.'"
              />
            </div>
          </div>

          {/* Section 3: Disclosing Party (Party 1) */}
          <div className="form-section" style={{ borderColor: "rgba(99, 102, 241, 0.2)" }}>
            <div className="form-section-title" style={{ color: "#a5b4fc" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", marginRight: "0.25rem" }}></span>
              <span>3. Disclosing Party (Party 1)</span>
            </div>

            <div className="form-group">
              <label htmlFor="party1Company">Company Name</label>
              <input
                type="text"
                id="party1Company"
                name="party1Company"
                value={formData.party1Company}
                onChange={handleInputChange}
                placeholder="Acme Corp"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="party1Name">Authorized Signer</label>
                <input
                  type="text"
                  id="party1Name"
                  name="party1Name"
                  value={formData.party1Name}
                  onChange={handleInputChange}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="party1Title">Signer Title</label>
                <input
                  type="text"
                  id="party1Title"
                  name="party1Title"
                  value={formData.party1Title}
                  onChange={handleInputChange}
                  placeholder="CEO"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="party1Address">Notice Address</label>
              <input
                type="text"
                id="party1Address"
                name="party1Address"
                value={formData.party1Address}
                onChange={handleInputChange}
                placeholder="Email or physical address"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="party1Signature">Signature text</label>
                <input
                  type="text"
                  id="party1Signature"
                  name="party1Signature"
                  value={formData.party1Signature}
                  onChange={handleInputChange}
                  placeholder="Type signature name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="party1Date">Date Signed</label>
                <input
                  type="date"
                  id="party1Date"
                  name="party1Date"
                  value={formData.party1Date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Receiving Party (Party 2) */}
          <div className="form-section" style={{ borderColor: "rgba(16, 185, 129, 0.2)" }}>
            <div className="form-section-title" style={{ color: "#a7f3d0" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", marginRight: "0.25rem" }}></span>
              <span>4. Receiving Party (Party 2)</span>
            </div>

            <div className="form-group">
              <label htmlFor="party2Company">Company Name</label>
              <input
                type="text"
                id="party2Company"
                name="party2Company"
                value={formData.party2Company}
                onChange={handleInputChange}
                placeholder="Beta Industries"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="party2Name">Authorized Signer</label>
                <input
                  type="text"
                  id="party2Name"
                  name="party2Name"
                  value={formData.party2Name}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                />
              </div>
              <div className="form-group">
                <label htmlFor="party2Title">Signer Title</label>
                <input
                  type="text"
                  id="party2Title"
                  name="party2Title"
                  value={formData.party2Title}
                  onChange={handleInputChange}
                  placeholder="CTO"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="party2Address">Notice Address</label>
              <input
                type="text"
                id="party2Address"
                name="party2Address"
                value={formData.party2Address}
                onChange={handleInputChange}
                placeholder="Email or physical address"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="party2Signature">Signature text</label>
                <input
                  type="text"
                  id="party2Signature"
                  name="party2Signature"
                  value={formData.party2Signature}
                  onChange={handleInputChange}
                  placeholder="Type signature name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="party2Date">Date Signed</label>
                <input
                  type="date"
                  id="party2Date"
                  name="party2Date"
                  value={formData.party2Date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Live Document Preview */}
        <main style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#111827",
          height: "100%",
          position: "relative"
        }}>
          {/* Tab Selector */}
          <div className="no-print" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            background: "rgba(17, 24, 39, 0.6)"
          }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setActiveTab("full")}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  background: activeTab === "full" ? "var(--primary)" : "transparent",
                  color: activeTab === "full" ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.2s"
                }}
              >
                Full Document
              </button>
              <button
                onClick={() => setActiveTab("cover")}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  background: activeTab === "cover" ? "var(--primary)" : "transparent",
                  color: activeTab === "cover" ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.2s"
                }}
              >
                Cover Page Only
              </button>
              <button
                onClick={() => setActiveTab("terms")}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  background: activeTab === "terms" ? "var(--primary)" : "transparent",
                  color: activeTab === "terms" ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.2s"
                }}
              >
                Standard Terms Only
              </button>
            </div>
            
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Live Document Preview (Real-time updates)
            </div>
          </div>

          {/* Paper View Container */}
          <div className="paper-container">
            {activeTab === "full" && (
              <>
                <div className="paper-page">
                  {renderCoverPage()}
                </div>
                <div className="paper-page">
                  {renderStandardTerms()}
                </div>
              </>
            )}
            {activeTab === "cover" && (
              <div className="paper-page">
                {renderCoverPage()}
              </div>
            )}
            {activeTab === "terms" && (
              <div className="paper-page">
                {renderStandardTerms()}
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
