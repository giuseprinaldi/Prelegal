import os
import json
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from litellm import completion
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MODEL = "openai/gpt-oss-120b:free"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

class NDAFormDataModel(BaseModel):
    purpose: Optional[str] = ""
    effectiveDate: Optional[str] = ""
    mndaTermType: Optional[str] = "expires"  # "expires" | "continues"
    mndaTermExpiresYears: Optional[str] = "1"
    confidentialityTermType: Optional[str] = "duration"  # "duration" | "perpetuity"
    confidentialityTermYears: Optional[str] = "5"
    governingLaw: Optional[str] = "Delaware"
    jurisdiction: Optional[str] = "courts located in New Castle County, Delaware"
    modifications: Optional[str] = "None."
    
    party1Company: Optional[str] = ""
    party1Name: Optional[str] = ""
    party1Title: Optional[str] = ""
    party1Address: Optional[str] = ""
    party1Date: Optional[str] = ""
    party1Signature: Optional[str] = ""
    
    party2Company: Optional[str] = ""
    party2Name: Optional[str] = ""
    party2Title: Optional[str] = ""
    party2Address: Optional[str] = ""
    party2Date: Optional[str] = ""
    party2Signature: Optional[str] = ""

class LLMChatResponse(BaseModel):
    assistant_message: str = Field(description="The conversational message to present to the user.")
    updated_variables: NDAFormDataModel = Field(description="The updated NDA form variables, extracted from the user's responses.")

SYSTEM_PROMPT = """You are Prelegal's AI assistant, a friendly legal drafting companion. Your goal is to guide the user in drafting a standard Mutual Non-Disclosure Agreement (Mutual NDA).

You are collaborating to fill out the cover page details:
1. PARTY 1 (Disclosing Party): Company Name, Signer Name, Title, Notice Address, Date, Signature.
2. PARTY 2 (Receiving Party): Company Name, Signer Name, Title, Notice Address, Date, Signature.
3. Core settings:
   - Purpose (Why is information shared? e.g. evaluating a partnership)
   - Effective Date
   - MNDA Term (How long the agreement lasts? e.g. expires in 1, 2, 3, or 5 years, or continues until terminated)
   - Confidentiality Term (How long information stays protected? e.g. 1-10 years, or in perpetuity)
   - Governing Law (e.g. Delaware) & Jurisdiction (court location)
   - Modifications (Any special exceptions, or 'None.')

Instructions:
- Hold a natural, step-by-step conversation. Do not ask for all fields at once! Start by greeting the user and asking for the two company names and the business purpose.
- If the user provides details, extract them and update the fields in `updated_variables`. If details are not mentioned, preserve their existing values from the current state.
- Be helpful. If they ask questions like "which state is standard for governing law?", explain that Delaware is very common for business agreements.
- Keep your conversational messages clear, concise, and focused on helping them complete the document. Once all fields are filled, let them know they can verify the preview on the right and download or print their completed NDA.
"""

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    chat_history: List[Dict[str, str]]  # list of {"role": "...", "content": "..."}
    current_variables: NDAFormDataModel

def run_ai_chat(message: str, chat_history: List[Dict[str, str]], current_variables: NDAFormDataModel) -> LLMChatResponse:
    # Build history messages for litellm
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    # Add history
    for msg in chat_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
        
    # Append current state context to user message
    variables_context = f"\n\n[Current document state variables: {current_variables.model_dump_json(indent=2)}]"
    messages.append({"role": "user", "content": f"{message}{variables_context}"})
    
    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=LLMChatResponse,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            timeout=30.0
        )
        result = response.choices[0].message.content
        chat_response = LLMChatResponse.model_validate_json(result)
        return chat_response
    except Exception as e:
        print(f"Error calling LLM: {e}")
        # Return fallback response with variables unchanged
        return LLMChatResponse(
            assistant_message=f"I'm sorry, I encountered an issue communicating with the AI backend: {str(e)}. Please try sending your message again.",
            updated_variables=current_variables
        )
