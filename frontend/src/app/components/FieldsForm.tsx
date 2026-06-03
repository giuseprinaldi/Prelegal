import type { Dispatch, SetStateAction } from "react";
import type { Template } from "./types";

interface FieldsFormProps {
  selectedTemplate: Template | null;
  formData: Record<string, string>;
  setFormData: Dispatch<SetStateAction<Record<string, string>>>;
}

export default function FieldsForm({ selectedTemplate, formData, setFormData }: FieldsFormProps) {
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
}
