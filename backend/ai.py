import os
import json
import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import litellm
from litellm import completion
from dotenv import load_dotenv

litellm.drop_params = True

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MODEL = "openai/gpt-oss-120b:free"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

class LLMChatResponse(BaseModel):
    assistant_message: str = Field(description="The conversational message to present to the user.")
    selected_document_type: str = Field(description="The exact name of the selected document from the catalog (e.g. 'Mutual Non-Disclosure Agreement - Standard Terms', 'Cloud Service Agreement', etc.). If the user wants to switch, change this.")
    updated_variables: Dict[str, str] = Field(description="The updated key-value variables dictionary for the selected document.")

def load_catalog_and_placeholders() -> List[Dict[str, Any]]:
    catalog_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "catalog.json"))
    
    if not os.path.exists(catalog_path):
        return []
        
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)
        
    for item in catalog:
        filepath = os.path.abspath(os.path.join(os.path.dirname(catalog_path), item["filename"]))
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as tf:
                content = tf.read()
            
            # Find all span placeholders
            spans = re.findall(r'<span\s+[^>]*class=["\']([^"\']+)["\'][^>]*>([^<]+)</span>', content)
            # Find all bracket placeholders (excluding markdown links)
            brackets = re.findall(r'\[([^\]\n]{2,40})\](?!\()', content)
            
            placeholders = set()
            for cls, text in spans:
                if "header_" not in cls:
                    placeholders.add(text.strip())
            for text in brackets:
                if text.strip().lower() not in ["", " ", "x"]:
                    placeholders.add(text.strip())
            
            item["placeholders"] = sorted(list(placeholders))
            item["content"] = content
        else:
            item["placeholders"] = []
            item["content"] = ""
            
    return catalog

# Load catalog data on import
CATALOG_DATA = load_catalog_and_placeholders()

def get_system_prompt(selected_doc: str) -> str:
    doc_list = []
    placeholders_list = []
    
    for item in CATALOG_DATA:
        doc_list.append(f"- {item['name']}: {item['description']}")
        if item['name'] == selected_doc:
            placeholders_list = item['placeholders']
            
    doc_list_text = "\n".join(doc_list)
    placeholders_text = ", ".join(placeholders_list) if placeholders_list else "None"
    
    prompt = f"""You are Prelegal's AI assistant, a friendly legal drafting companion. Your goal is to guide the user in selecting and drafting legal agreements.

We support the following document types from our catalog:
{doc_list_text}

Instructions:
1. Document Selection:
   - If the user has not selected a document type yet (selected_document_type is 'None' or empty), help them choose one from the list based on their business needs. Ask them what kind of agreement they want to draft.
   - If the user asks for an unsupported document (e.g. 'Employment Agreement', 'Lease Agreement'), politely explain that we do not support it, but recommend the closest match from our supported list (e.g., 'Professional Services Agreement' or 'Partnership Agreement').
   - If they select one, set the `selected_document_type` to the exact name from the catalog.

2. Document Drafting:
   - Once a document is selected (currently: '{selected_doc}'), guide the user through filling out its placeholders.
   - The required variables/placeholders for the selected document '{selected_doc}' are: {placeholders_text}
   - Hold a natural, step-by-step conversation. Do not ask for all fields at once! Ask for 1 or 2 fields at a time.
   - If the user provides details, extract them and update the fields in `updated_variables`. If they modify an existing variable, update it. Preserve all other variables unchanged.
   - Be helpful. If they ask questions about what a term means (e.g. 'Governing Law', 'Uptime Credit'), explain it simply.
   - Keep your conversational messages clear, concise, and focused on helping them complete the document. Once all fields are filled, let them know they can verify the preview on the right and download or print the completed document.

Output Format:
You MUST respond with a valid JSON object matching this structure:
{{
  "assistant_message": "your reply text here",
  "selected_document_type": "name of selected document or empty string if not selected",
  "updated_variables": {{
    "variable_name": "extracted value"
  }}
}}
Do not include any text outside of the JSON object.
"""
    return prompt

class ChatRequest(BaseModel):
    message: str
    chat_history: List[Dict[str, str]]
    selected_document_type: str
    current_variables: Dict[str, str]

def run_ai_chat(message: str, chat_history: List[Dict[str, str]], selected_document_type: str, current_variables: Dict[str, str]) -> LLMChatResponse:
    # Build system prompt dynamically based on the selected document type
    sys_prompt = get_system_prompt(selected_document_type)
    
    messages = [
        {"role": "system", "content": sys_prompt}
    ]
    
    # Add history
    for msg in chat_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
        
    # Append current state context to user message
    variables_context = f"\n\n[Current Selected Document: {selected_document_type}]\n[Current variables state: {json.dumps(current_variables, indent=2)}]"
    messages.append({"role": "user", "content": f"{message}{variables_context}"})
    
    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            api_key=os.environ.get("OPENROUTER_API_KEY"),
            api_base="https://openrouter.ai/api/v1",
            extra_body=EXTRA_BODY,
            num_retries=3,
            timeout=30.0
        )
        result = response.choices[0].message.content
        
        # Try to parse result as JSON
        try:
            cleaned_result = result.strip()
            # If the response is wrapped in a markdown code block, extract the content
            if cleaned_result.startswith("```"):
                match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned_result, re.DOTALL)
                if match:
                    cleaned_result = match.group(1).strip()
            
            # 1. First try to load as standard JSON dict
            data = json.loads(cleaned_result)
            if isinstance(data, dict):
                # Map alternate keys if necessary
                assistant_msg = data.get("assistant_message") or data.get("message") or data.get("response") or ""
                doc_type = data.get("selected_document_type") or data.get("selected_doc") or selected_document_type
                variables = data.get("updated_variables")
                
                # Make sure the variables keys/values are strings
                clean_vars = {}
                if isinstance(variables, dict):
                    for k, v in variables.items():
                        clean_vars[str(k)] = str(v) if v is not None else ""
                else:
                    clean_vars = current_variables

                return LLMChatResponse(
                    assistant_message=str(assistant_msg) if assistant_msg else result,
                    selected_document_type=str(doc_type),
                    updated_variables=clean_vars
                )
            
            # 2. Fall back to standard model validation if it's not a dict
            chat_response = LLMChatResponse.model_validate_json(cleaned_result)
            return chat_response
        except Exception as json_err:
            print(f"Failed to parse LLM response as LLMChatResponse JSON: {json_err}. Raw response: {result}")
            
            # Fallback: Try regex parsing for corrupted JSON (commas instead of colons, mismatched brackets, etc.)
            try:
                # 1. Try to extract assistant_message
                msg = ""
                msg_match = re.search(r'["\']assistant_message["\']\s*[:,\s]\s*"((?:[^"\\]|\\.)*)"', cleaned_result, re.DOTALL)
                if msg_match:
                    msg = msg_match.group(1)
                else:
                    msg_match = re.search(r'["\']assistant_message["\']\s*[:,\s]\s*\'((?:[^\'\\]|\\.)*)\'', cleaned_result, re.DOTALL)
                    if msg_match:
                        msg = msg_match.group(1)
                        
                if msg:
                    try:
                        msg = json.loads(f'"{msg}"')
                    except Exception:
                        msg = msg.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"').replace("\\'", "'")
                        
                # 2. Try to extract selected_document_type
                doc_type = ""
                doc_match = re.search(r'["\']selected_document_type["\']\s*[:,\s]\s*"((?:[^"\\]|\\.)*)"', cleaned_result, re.DOTALL)
                if doc_match:
                    doc_type = doc_match.group(1)
                else:
                    doc_match = re.search(r'["\']selected_document_type["\']\s*[:,\s]\s*\'((?:[^\'\\]|\\.)*)\'', cleaned_result, re.DOTALL)
                    if doc_match:
                        doc_type = doc_match.group(1)
                        
                if doc_type:
                    try:
                        doc_type = json.loads(f'"{doc_type}"')
                    except Exception:
                        doc_type = doc_type.replace('\\"', '"').replace("\\'", "'")
                else:
                    doc_type = selected_document_type

                # 3. Try to extract updated_variables
                vars_dict = {}
                vars_match = re.search(r'["\']updated_variables["\']\s*[:,\s]\s*\{([^\}]+)\}', cleaned_result, re.DOTALL)
                if vars_match:
                    vars_block = vars_match.group(1)
                    str_matches = re.findall(r'"((?:[^"\\]|\\.)*)"', vars_block)
                    if not str_matches:
                        str_matches = re.findall(r'\'((?:[^\'\\]|\\.)*)\'', vars_block)
                        
                    if str_matches:
                        decoded_strs = []
                        for s in str_matches:
                            try:
                                decoded_strs.append(json.loads(f'"{s}"'))
                            except Exception:
                                decoded_strs.append(s.replace('\\"', '"').replace("\\'", "'"))
                        
                        for i in range(0, len(decoded_strs) - 1, 2):
                            key = decoded_strs[i].strip()
                            val = decoded_strs[i+1]
                            if key:
                                vars_dict[key] = val
                                
                # Merge variables
                final_vars = {**current_variables}
                for k, v in vars_dict.items():
                    matched_key = None
                    for ck in current_variables.keys():
                        if ck.lower() == k.lower():
                            matched_key = ck
                            break
                    if matched_key:
                        final_vars[matched_key] = str(v)
                    else:
                        final_vars[k] = str(v)
                        
                return LLMChatResponse(
                    assistant_message=msg if msg else result,
                    selected_document_type=doc_type if doc_type else selected_document_type,
                    updated_variables=final_vars
                )
            except Exception as fallback_err:
                print(f"Fallback corrupted JSON parser also failed: {fallback_err}")
                return LLMChatResponse(
                    assistant_message=result,
                    selected_document_type=selected_document_type,
                    updated_variables=current_variables
                )
            
    except Exception as e:
        print(f"Error calling LLM: {e}")
        # Return fallback response with error message
        return LLMChatResponse(
            assistant_message=f"I'm sorry, I encountered an issue communicating with the AI backend: {str(e)}. Please try sending your message again.",
            selected_document_type=selected_document_type,
            updated_variables=current_variables
        )
