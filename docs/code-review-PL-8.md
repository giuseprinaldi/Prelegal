# Code Review — Prelegal (PL-8)

> Comprehensive review of the Prelegal codebase with the 5 most valuable
> improvements, ordered by priority. Tracked in Jira ticket
> [PL-8](https://giuseprinaldi.atlassian.net/browse/PL-8).

## Overall assessment

A solid, working full-stack app for an early-stage project. The architecture is
clean and sensible:

- **Backend:** FastAPI + SQLModel, JWT auth, AI chat via LiteLLM.
- **Frontend:** statically-exported Next.js, served by FastAPI.
- **Packaging:** multi-stage Dockerfile.

Strengths worth keeping:

- The frontend is split into focused components (`ChatPanel`, `DocumentPreview`,
  `FieldsForm`, `Header`, `AuthModal`, `LandingPage`).
- There is a real test suite, including tests for the fragile AI-parsing path
  (`backend/tests/test_ai.py`).
- The Dockerfile correctly keeps `.env` out of image layers and provides
  secrets at runtime.

The items below are improvements, not blockers.

---

## 1. 🔴 XSS vulnerability in the document preview (security — highest priority)

`frontend/src/app/components/DocumentPreview.tsx` renders AI/user content with
`dangerouslySetInnerHTML`, and `frontend/src/app/page.tsx` (`getRenderedHtml`)
builds that HTML by injecting raw form values into the template before
`marked.parse()`:

```ts
const val = formData[placeholder] || "";
const displayVal = val
  ? `<span class="filled-variable">${val}</span>`
  : `<span class="highlight-field">[${placeholder}]</span>`;
```

A value like `<img src=x onerror=alert(document.cookie)>` typed into a field — or
returned by the LLM — executes in the browser. Because the JWT lives in
`localStorage`, a successful XSS can exfiltrate the auth token.

**Fix:** Sanitize before rendering — add `dompurify` and wrap the output:
`DOMPurify.sanitize(marked.parse(text))`. At minimum, HTML-escape user-supplied
`val` before interpolation.

---

## 2. 🔴 Insecure CORS + JWT secret defaults (security)

In `backend/main.py` and `backend/auth.py`:

- `allow_origins=["*"]` **combined with** `allow_credentials=True` is both
  insecure and an invalid CORS combination that browsers reject. Restrict
  origins to a configured allowlist (e.g. `http://localhost:8000`, plus `:3000`
  for dev).
- The JWT secret falls back to a hardcoded string:
  `os.getenv("JWT_SECRET_KEY", "prelegal-super-secret-key-for-development-only")`.
  If the env var is ever unset in production, every token becomes forgeable.
  **Fail loudly** if the secret is missing rather than silently using the public
  default.

---

## 3. 🟡 Use real Structured Outputs in `ai.py`

`backend/ai.py` uses `response_format={"type": "json_object"}` and then carries
~130 lines of manual repair logic — regex extraction of `assistant_message`,
comma-vs-colon recovery, bracket counting. This is fragile and hard to maintain.

`agents.md` explicitly asks for **Structured Outputs** with a schema. Passing the
Pydantic schema (`LLMChatResponse`) as a JSON-schema `response_format` lets the
provider enforce shape, which would let you delete most of the fallback parser.
The existing corrupted-JSON tests are a sign the current approach can't be
trusted to return valid JSON.

Smaller related items:

- Replace the `print(...)` debug calls with the `logging` module.
- The LLM call is synchronous inside an async-capable app — under load it will
  block the event loop. Tolerable today (called from a sync endpoint), but worth
  noting as you scale.

---

## 4. 🟡 Heavy duplication in the document endpoints (maintainability)

In `backend/main.py`, the `DocumentResponse(...)` construction with
`variables=json.loads(doc.variables)` is hand-written **four times**
(create / list / get / update). Any field change must be made in four places.

**Fix:** Add a single helper, e.g.

```python
def to_response(doc: Document) -> DocumentResponse:
    return DocumentResponse(
        **doc.model_dump(exclude={"variables"}),
        variables=json.loads(doc.variables),
    )
```

Better still, store `variables` as a proper JSON column (SQLModel supports
`Column(JSON)`) and drop the manual `json.loads` / `json.dumps` round-trips
entirely.

---

## 5. 🟢 Input validation & password edge cases (robustness)

- **bcrypt's 72-byte limit:** passwords longer than 72 bytes are silently
  truncated by bcrypt. Add a length check in `UserCreate` so users aren't
  surprised, and validate minimum password length / non-empty username
  (currently `str` with no constraints — use `pydantic.Field(min_length=...)`).
- **`current_user.id` is `Optional[int]`** (`database.py`), so
  `user_id=current_user.id` is `int | None` to the type checker. Fine at
  runtime, but tightening this avoids type-checker noise.
- The frontend backend-URL detection keys off `window.location.port === "3000"`
  (`page.tsx`) — brittle. An env-based config (`NEXT_PUBLIC_API_BASE`) would be
  cleaner.

---

## Quick wins summary

| # | Area                                   | Severity | Effort |
|---|----------------------------------------|----------|--------|
| 1 | Sanitize preview HTML (XSS)            | High     | Low    |
| 2 | Lock down CORS + require JWT secret    | High     | Low    |
| 3 | Use real Structured Outputs in `ai.py` | Medium   | Medium |
| 4 | De-duplicate document serialization    | Medium   | Low    |
| 5 | Input validation / password limits     | Low      | Low    |

The two security items (#1, #2) are quick to fix and should be done first.
