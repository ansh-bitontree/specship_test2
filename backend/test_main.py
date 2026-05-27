import os

from fastapi.testclient import TestClient

from backend.main import app


def test_gemini_chat_rejects_empty_messages():
    client = TestClient(app)

    response = client.post("/api/gemini/chat", json={"message": "   "})

    assert response.status_code == 422
    assert response.json()["detail"] == "Message is required."


def test_gemini_chat_uses_server_side_api_key(monkeypatch):
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

    def fake_post(url, *, params, json, timeout):
        captured["url"] = url
        captured["params"] = params
        captured["json"] = json
        captured["timeout"] = timeout
        return GeminiResponse()

    monkeypatch.setenv("GEMINI_API_KEY", "server-secret")
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 200
    assert response.json() == {"content": "Backend response"}
    assert captured["params"] == {"key": os.environ["GEMINI_API_KEY"]}
    assert "server-secret" not in str(captured["json"])
