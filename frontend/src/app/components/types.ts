// Shared types used across the Prelegal UI components.

export interface Template {
  name: string;
  description: string;
  filename: string;
  placeholders: string[];
  content: string;
}

export interface SavedDocument {
  id: number;
  title: string;
  document_type: string;
  variables: Record<string, string>;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export type AuthMode = "login" | "signup";
