import httpx
from fastapi.testclient import TestClient

from backend.main import app


def test_gemini_chat_rejects_empty_messages():
    client = TestClient(app)

    response = client.post("/api/gemini/chat", json={"message": "   "})

    assert response.status_code == 422
    assert response.json()["detail"] == "Message is required."


def test_gemini_chat_uses_header_auth_and_configured_model(monkeypatch):
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
    monkeypatch.setenv("GEMINI_MODEL", "gemini-custom-model")
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 200
    assert response.json() == {"content": "Backend response"}
    assert captured["url"].endswith("/models/gemini-custom-model:generateContent")
    assert captured["headers"] == {"x-goog-api-key": "server-secret"}
    assert "server-secret" not in captured["url"]
    assert "server-secret" not in str(captured["json"])


def test_gemini_chat_defaults_to_current_flash_model(monkeypatch):
    captured = {}

    def fake_post(url, *, headers, json, timeout):
        captured["url"] = url
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"content": {"parts": [{"text": "Default model response"}]}},
                ],
            },
        )

    monkeypatch.setenv("GEMINI_API_KEY", "server-secret")
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 200
    assert response.json() == {"content": "Default model response"}
    assert captured["url"].endswith("/models/gemini-3.5-flash:generateContent")


def test_gemini_http_errors_are_sanitized(monkeypatch):
    def fake_post(url, *, headers, json, timeout):
        request = httpx.Request("POST", url)
        response = httpx.Response(404, request=request, json={"error": {"message": "secret leaked"}})
        raise httpx.HTTPStatusError("404 for url with server-secret", request=request, response=response)

    monkeypatch.setenv("GEMINI_API_KEY", "server-secret")
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 502
    assert response.json()["detail"] == "Gemini request failed. Try again later."
    assert "server-secret" not in response.text
