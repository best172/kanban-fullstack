import os
from contextlib import asynccontextmanager
from typing import Literal
from uuid import UUID

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not supabase_url or not supabase_key:
    # Keep app importable for docs/build; requests return a helpful 503 until configured.
    db: Client | None = None
else:
    db = create_client(supabase_url, supabase_key)

origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if x.strip()]

app = FastAPI(title="Kanban Board API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

Status = Literal["todo", "doing", "done"]

class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)

class CardMove(BaseModel):
    status: Status

def client() -> Client:
    if db is None:
        raise HTTPException(status_code=503, detail="Backend is not configured. Set Supabase environment variables.")
    return db

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/cards")
def list_cards():
    result = client().table("cards").select("id,title,status,created_at").order("created_at", desc=True).execute()
    return result.data

@app.post("/api/cards", status_code=201)
def create_card(payload: CardCreate):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be blank")
    result = client().table("cards").insert({"title": title, "status": "todo"}).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Card was not created")
    return result.data[0]

@app.patch("/api/cards/{card_id}")
def move_card(card_id: UUID, payload: CardMove):
    result = client().table("cards").update({"status": payload.status}).eq("id", str(card_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Card not found")
    return result.data[0]

@app.delete("/api/cards/{card_id}", status_code=204)
def delete_card(card_id: UUID):
    result = client().table("cards").delete().eq("id", str(card_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Card not found")
    return Response(status_code=204)
