"""Unit tests for the LLM response parsing / repair logic in ai.py.

These tests do NOT hit the network. They patch `ai.completion` (the LiteLLM call)
to return canned `content` strings, so we exercise only the parsing, key-mapping,
and corrupted-JSON fallback code paths in `run_ai_chat`.
"""

from types import SimpleNamespace
from unittest.mock import patch

from ai import run_ai_chat

# A real catalog document name, used so document-type handling is realistic.
DOC = "Mutual Non-Disclosure Agreement - Standard Terms"


def make_completion_mock(content: str):
    """Build an object shaped like a LiteLLM completion response.

    The code under test reads `response.choices[0].message.content`.
    """
    message = SimpleNamespace(content=content)
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


def run_with(content: str, *, message="hi", history=None, doc=DOC, current=None):
    """Run run_ai_chat with `ai.completion` patched to return `content`."""
    with patch("ai.completion", return_value=make_completion_mock(content)):
        return run_ai_chat(
            message=message,
            chat_history=history or [],
            selected_document_type=doc,
            current_variables=current or {},
        )


# --- Happy path: clean JSON ------------------------------------------------

def test_clean_json_is_parsed():
    content = (
        '{"assistant_message": "Hi there", '
        '"selected_document_type": "Cloud Service Agreement", '
        '"updated_variables": {"Provider": "Acme"}}'
    )
    result = run_with(content)
    assert result.assistant_message == "Hi there"
    assert result.selected_document_type == "Cloud Service Agreement"
    assert result.updated_variables == {"Provider": "Acme"}


def test_json_wrapped_in_markdown_code_block():
    content = (
        "```json\n"
        '{"assistant_message": "Wrapped", "selected_document_type": "", '
        '"updated_variables": {}}\n'
        "```"
    )
    result = run_with(content)
    assert result.assistant_message == "Wrapped"


def test_alternate_keys_are_mapped():
    # Model uses "message" and "selected_doc" instead of the canonical keys.
    content = (
        '{"message": "alt key", "selected_doc": "Pilot Agreement", '
        '"updated_variables": {"Term": "30 days"}}'
    )
    result = run_with(content)
    assert result.assistant_message == "alt key"
    assert result.selected_document_type == "Pilot Agreement"
    assert result.updated_variables == {"Term": "30 days"}


def test_non_string_variable_values_are_coerced():
    content = (
        '{"assistant_message": "x", "selected_document_type": "", '
        '"updated_variables": {"Count": 5, "Active": true, "Empty": null}}'
    )
    result = run_with(content)
    assert result.updated_variables["Count"] == "5"
    assert result.updated_variables["Active"] == "True"
    assert result.updated_variables["Empty"] == ""


def test_missing_variables_preserves_current():
    content = '{"assistant_message": "no vars here", "selected_document_type": ""}'
    result = run_with(content, current={"Provider": "Keep"})
    assert result.updated_variables == {"Provider": "Keep"}


# --- Corrupted JSON: regex fallback ----------------------------------------

def test_corrupted_json_recovered_by_regex_fallback():
    # Colons replaced with commas -> invalid JSON, must be recovered by regex.
    content = (
        '{"assistant_message", "Recovered message", '
        '"selected_document_type", "Cloud Service Agreement", '
        '"updated_variables": {"Provider": "Acme Inc"}}'
    )
    result = run_with(content)
    assert result.assistant_message == "Recovered message"
    assert result.selected_document_type == "Cloud Service Agreement"
    assert result.updated_variables["Provider"] == "Acme Inc"


def test_fallback_merges_variables_case_insensitively():
    # Model returns "provider" (lowercase) but we already track "Provider".
    content = (
        '{"assistant_message", "msg", '
        '"updated_variables": {"provider": "New Co"}}'
    )
    result = run_with(content, current={"Provider": "Old"})
    assert result.updated_variables["Provider"] == "New Co"
    assert "provider" not in result.updated_variables


def test_total_garbage_preserves_state():
    result = run_with("this is not json at all", current={"Provider": "Keep"})
    # Document type and variables are preserved; raw text surfaces as the message.
    assert result.selected_document_type == DOC
    assert result.updated_variables == {"Provider": "Keep"}


# --- LLM call itself fails -------------------------------------------------

def test_completion_exception_returns_apology_and_preserves_state():
    with patch("ai.completion", side_effect=Exception("boom")):
        result = run_ai_chat(
            message="hi",
            chat_history=[],
            selected_document_type=DOC,
            current_variables={"Provider": "Keep"},
        )
    assert result.assistant_message.startswith("I'm sorry")
    assert result.selected_document_type == DOC
    assert result.updated_variables == {"Provider": "Keep"}
