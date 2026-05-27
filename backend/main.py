import os

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class GeminiChatRequest(BaseModel):
    message: str


class GeminiChatResponse(BaseModel):
    content: str


app = FastAPI(title="Specship Gemini Proxy")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/api/gemini/chat", response_model=GeminiChatResponse)
def chat_with_gemini(request: GeminiChatRequest) -> GeminiChatResponse:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message is required.")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured.")

    response = httpx.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        params={"key": api_key},
        json={"contents": [{"parts": [{"text": message}]}]},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    try:
        content = payload["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=502, detail="Gemini returned an unexpected response.")

    return GeminiChatResponse(content=content)
