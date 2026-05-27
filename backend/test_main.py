import httpx
from fastapi.testclient import TestClient

from backend.main import app


def test_gemini_chat_rejects_empty_messages():
    client = TestClient(app)

    response = client.post("/api/gemini/chat", json={"message": "   "})

    assert response.status_code == 422
    assert response.json()["detail"] == "Message is required."


def test_gemini_chat_uses_header_api_key_and_configurable_model(monkeypatch):
    class GeminiResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {"text": "Backend response"},
                            ],
                        },
                    },
                ],
            }

    captured = {}

    def fake_post(url, *, headers, json, timeout):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return GeminiResponse()

    monkeypatch.setenv("GEMINI_API_KEY", "server-secret")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.5-flash")
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 200
    assert response.json() == {"content": "Backend response"}
    assert captured["url"].endswith("/models/gemini-3.5-flash:generateContent")
    assert captured["headers"] == {"x-goog-api-key": "server-secret"}
    assert "server-secret" not in captured["url"]
    assert "server-secret" not in str(captured["json"])


def test_gemini_chat_sanitizes_upstream_errors(monkeypatch):
    request = httpx.Request(
        "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        headers={"x-goog-api-key": "server-secret"},
    )
    upstream_response = httpx.Response(
        404,
        request=request,
        json={"error": {"message": "model not found for server-secret"}},
    )

    class GeminiResponse:
        def raise_for_status(self):
            raise httpx.HTTPStatusError(
                "404 Client Error for url with server-secret",
                request=request,
                response=upstream_response,
            )

    def fake_post(url, *, headers, json, timeout):
        return GeminiResponse()

    monkeypatch.setenv("GEMINI_API_KEY", "server-secret")
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 502
    assert response.json()["detail"] == "Gemini request failed. Try again later."
    assert "server-secret" not in response.text
