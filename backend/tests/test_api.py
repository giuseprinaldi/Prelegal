import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from main import app
from database import get_db, User, Document

# Setup an in-memory SQLite database for testing
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_db_override():
        return session

    app.dependency_overrides[get_db] = get_db_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_signup_and_login(client: TestClient):
    # Test Signup
    response = client.post(
        "/api/auth/signup",
        json={"username": "testuser", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser"
    
    token = data["access_token"]
    
    # Test Login
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpassword"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

    # Test me endpoint with auth header
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_document_crud(client: TestClient):
    # Register and login
    response = client.post(
        "/api/auth/signup",
        json={"username": "docuser", "password": "docpassword"},
    )
    token = response.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Create Document
    doc_payload = {
        "document_type": "Mutual NDA",
        "title": "My NDA Test",
        "variables": {
            "purpose": "Testing document CRUD operations",
            "effectiveDate": "2026-06-02"
        },
        "content": "# Test NDA Content"
    }
    
    response = client.post(
        "/api/documents",
        json=doc_payload,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "My NDA Test"
    assert data["variables"]["purpose"] == "Testing document CRUD operations"
    doc_id = data["id"]

    # Read Document
    response = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "My NDA Test"

    # List Documents
    response = client.get("/api/documents", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == doc_id

    # Update Document
    update_payload = {
        "title": "Updated NDA Test",
        "variables": {
            "purpose": "Updated testing",
            "effectiveDate": "2026-06-03"
        }
    }
    response = client.put(f"/api/documents/{doc_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Updated NDA Test"
    assert response.json()["variables"]["purpose"] == "Updated testing"

    # Delete Document
    response = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 200
    
    # Read deleted Document (should be 404)
    response = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert response.status_code == 404

from unittest.mock import patch
from ai import LLMChatResponse, NDAFormDataModel

def test_ai_chat_endpoint(client: TestClient):
    mock_response = LLMChatResponse(
        assistant_message="Hello, I have updated the company names for you.",
        updated_variables=NDAFormDataModel(
            party1Company="Mock Party 1",
            party2Company="Mock Party 2"
        )
    )
    
    with patch("main.run_ai_chat", return_value=mock_response) as mock_run:
        payload = {
            "message": "Update company names to Mock Party 1 and Mock Party 2",
            "chat_history": [],
            "current_variables": {}
        }
        response = client.post("/api/chat", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["assistant_message"] == "Hello, I have updated the company names for you."
        assert data["updated_variables"]["party1Company"] == "Mock Party 1"
        assert data["updated_variables"]["party2Company"] == "Mock Party 2"
        
        mock_run.assert_called_once()
