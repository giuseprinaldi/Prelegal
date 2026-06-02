import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, create_engine, Session, Relationship
import json

DATABASE_URL = "sqlite:///./prelegal.db"

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def get_utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    created_at: datetime.datetime = Field(default_factory=get_utcnow)
    
    documents: List["Document"] = Relationship(back_populates="user")

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    document_type: str = Field(nullable=False)
    title: str = Field(nullable=False)
    variables: str = Field(default="{}")  # JSON string of form variables
    content: str = Field(nullable=False)   # Generated markdown content
    created_at: datetime.datetime = Field(default_factory=get_utcnow)
    updated_at: datetime.datetime = Field(default_factory=get_utcnow)
    
    user: User = Relationship(back_populates="documents")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_db():
    with Session(engine) as session:
        yield session
