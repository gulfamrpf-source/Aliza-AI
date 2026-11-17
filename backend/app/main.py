from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .config import settings
from .db import connect, init_db
from .ai import generate_reply

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(min_length=1, max_length=12000)

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "ai_provider": settings.ai_provider}

@app.get("/api/conversations")
def list_conversations():
    with connect() as conn:
        rows = conn.execute("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC").fetchall()
        return [dict(row) for row in rows]

@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str):
    with connect() as conn:
        exists = conn.execute("SELECT id FROM conversations WHERE id=?", (conversation_id,)).fetchone()
        if not exists:
            raise HTTPException(404, "Conversation not found")
        rows = conn.execute("SELECT id, role, content, created_at FROM messages WHERE conversation_id=? ORDER BY id", (conversation_id,)).fetchall()
        return [dict(row) for row in rows]

@app.post("/api/chat")
def chat(body: ChatRequest):
    conversation_id = body.conversation_id or str(uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with connect() as conn:
        exists = conn.execute("SELECT id FROM conversations WHERE id=?", (conversation_id,)).fetchone()
        if not exists:
            title = body.message.strip().replace("\n", " ")[:48] or "New chat"
            conn.execute("INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)", (conversation_id, title, now, now))
        conn.execute("INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)", (conversation_id, body.message))
        history = conn.execute("SELECT role, content FROM messages WHERE conversation_id=? ORDER BY id", (conversation_id,)).fetchall()
        messages = [{"role": row["role"], "content": row["content"]} for row in history]
    try:
        answer = generate_reply(messages)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    with connect() as conn:
        conn.execute("INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", (conversation_id, answer))
        conn.execute("UPDATE conversations SET updated_at=? WHERE id=?", (now, conversation_id))
    return {"conversation_id": conversation_id, "reply": answer, "provider": settings.ai_provider}

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str):
    with connect() as conn:
        conn.execute("DELETE FROM messages WHERE conversation_id=?", (conversation_id,))
        result = conn.execute("DELETE FROM conversations WHERE id=?", (conversation_id,))
        if result.rowcount == 0:
            raise HTTPException(404, "Conversation not found")
    return {"deleted": True}
