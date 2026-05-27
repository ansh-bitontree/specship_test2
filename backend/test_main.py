import httpx
from fastapi.testclient import TestClient
from pathlib import Path

from backend.main import app


ROOT = Path(__file__).resolve().parents[1]


def test_gemini_chat_rejects_empty_messages():
    client = TestClient(app)

    response = client.post("/api/gemini/chat", json={"message": "   "})

    assert response.status_code == 422
    assert response.json()["detail"] == "Message is required."


def test_gemini_chat_uses_configured_model_and_header_api_key(monkeypatch):
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
    monkeypatch.setenv("GEMINI_MODEL", "gemini-test-model")
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 200
    assert response.json() == {"content": "Backend response"}
    assert captured["url"].endswith("/models/gemini-test-model:generateContent")
    assert captured["headers"] == {"x-goog-api-key": "server-secret"}
    assert "server-secret" not in captured["url"]
    assert "server-secret" not in str(captured["json"])


def test_gemini_chat_defaults_to_supported_model(monkeypatch):
    class GeminiResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "candidates": [
                    {"content": {"parts": [{"text": "Default model response"}]}},
                ],
            }

    captured = {}

    def fake_post(url, *, headers, json, timeout):
        captured["url"] = url
        return GeminiResponse()

    monkeypatch.setenv("GEMINI_API_KEY", "server-secret")
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 200
    assert "gemini-3.5-flash" in captured["url"]


def test_gemini_http_failures_return_sanitized_error(monkeypatch):
    api_key = "server-secret"

    def fake_post(url, *, headers, json, timeout):
        request = httpx.Request("POST", url, headers=headers)
        response = httpx.Response(
            404,
            request=request,
            text=f"model missing for key {api_key}",
        )
        raise httpx.HTTPStatusError(
            f"404 from upstream with {api_key}",
            request=request,
            response=response,
        )

    monkeypatch.setenv("GEMINI_API_KEY", api_key)
    monkeypatch.setattr("backend.main.httpx.post", fake_post)

    client = TestClient(app)
    response = client.post("/api/gemini/chat", json={"message": "Hello Gemini"})

    assert response.status_code == 502
    assert response.json()["detail"] == "Gemini request failed. Try again later."
    assert api_key not in response.text


def test_local_setup_files_document_env_and_required_dependencies():
    requirements = (ROOT / "requirements.txt").read_text()
    requirements_dev = (ROOT / "requirements-dev.txt").read_text()
    env_example = (ROOT / "backend" / ".env.example").read_text()
    gitignore = (ROOT / ".gitignore").read_text()

    assert "python-dotenv" in requirements
    assert "trio" in requirements
    assert "anyio<4.13" in requirements
    assert "httpcore" in requirements
    assert "pytest" in requirements_dev
    assert "GEMINI_API_KEY=" in env_example
    assert "GEMINI_MODEL=gemini-3.5-flash" in env_example
    assert ".env" in gitignore
    assert "backend/.env" in gitignore
