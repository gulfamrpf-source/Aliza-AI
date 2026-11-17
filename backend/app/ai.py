import json
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from .config import settings


def generate_reply(messages: list[dict[str, str]]) -> str:
    if settings.ai_provider.lower() != "ollama":
        last = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return ("Welcome to Alizariz AI. This is the local demo response, not a trained Alizariz model yet. "
                "Your chat interface and conversation storage are working. To use a locally hosted model, "
                "install Ollama, pull a small model, and set AI_PROVIDER=ollama in backend/.env.\n\n"
                f"You said: {last}")

    payload = json.dumps({
        "model": settings.ollama_model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.7}
    }).encode("utf-8")
    request = Request(
        settings.ollama_base_url.rstrip("/") + "/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=180) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("message", {}).get("content", "The local model returned an empty response.")
    except (URLError, HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(
            "Could not reach the local Ollama model. Check that Ollama is running and that the configured model is downloaded."
        ) from exc
