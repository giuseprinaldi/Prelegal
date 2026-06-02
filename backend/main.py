import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from sqlmodel import Session, select
import json
import datetime
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from database import create_db_and_tables, get_db, User, Document
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from ai import ChatRequest, run_ai_chat

# Pydantic schemas for request/response bodies
class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class DocumentCreate(BaseModel):
    document_type: str
    title: str
    variables: dict  # We'll serialize this to JSON string
    content: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    variables: Optional[dict] = None
    content: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    document_type: str
    title: str
    variables: dict
    content: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB and tables on startup
    create_db_and_tables()
    yield

app = FastAPI(title="Prelegal Backend API", lifespan=lifespan)

# Allow CORS for development (Next.js dev server on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Endpoints
@app.post("/api/auth/signup", response_model=TokenResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    existing = db.exec(select(User).where(User.username == user_data.username)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    user = db.exec(select(User).where(User.username == user_data.username)).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Document Persistence Endpoints
@app.post("/api/documents", response_model=DocumentResponse)
def create_document(doc_data: DocumentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vars_str = json.dumps(doc_data.variables)
    new_doc = Document(
        user_id=current_user.id,
        document_type=doc_data.document_type,
        title=doc_data.title,
        variables=vars_str,
        content=doc_data.content
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return DocumentResponse(
        id=new_doc.id,
        user_id=new_doc.user_id,
        document_type=new_doc.document_type,
        title=new_doc.title,
        variables=json.loads(new_doc.variables),
        content=new_doc.content,
        created_at=new_doc.created_at,
        updated_at=new_doc.updated_at
    )

@app.get("/api/documents", response_model=List[DocumentResponse])
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.exec(select(Document).where(Document.user_id == current_user.id).order_by(Document.updated_at.desc())).all()
    
    response_docs = []
    for doc in docs:
        response_docs.append(DocumentResponse(
            id=doc.id,
            user_id=doc.user_id,
            document_type=doc.document_type,
            title=doc.title,
            variables=json.loads(doc.variables),
            content=doc.content,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        ))
    return response_docs

@app.get("/api/documents/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.exec(select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        document_type=doc.document_type,
        title=doc.title,
        variables=json.loads(doc.variables),
        content=doc.content,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@app.put("/api/documents/{doc_id}", response_model=DocumentResponse)
def update_document(doc_id: int, doc_data: DocumentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.exec(select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if doc_data.title is not None:
        doc.title = doc_data.title
    if doc_data.variables is not None:
        doc.variables = json.dumps(doc_data.variables)
    if doc_data.content is not None:
        doc.content = doc_data.content
        
    doc.updated_at = datetime.datetime.utcnow()
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        document_type=doc.document_type,
        title=doc.title,
        variables=json.loads(doc.variables),
        content=doc.content,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.exec(select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}

# AI Chat Endpoint
@app.post("/api/chat")
def chat_with_ai(chat_req: ChatRequest):
    response = run_ai_chat(
        message=chat_req.message,
        chat_history=chat_req.chat_history,
        current_variables=chat_req.current_variables
    )
    return response

# Frontend static serving and client routing fallback
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "out"))

# Custom exception handler for 404 to fall back to index.html for React App Router
@app.exception_handler(404)
async def not_found_handler(request, exc):
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(status_code=404, content={"detail": f"Static folder empty or index.html not found at {index_path}"})

# Mount the static files at the root
# Check if static directory exists, mount it if it does
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")
