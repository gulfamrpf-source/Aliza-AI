# Alizariz AI — Milestone 1 Starter

A local-first ChatGPT-style web app starter for Windows. Includes a React + Vite frontend, FastAPI backend, SQLite chat persistence, and optional Ollama local-model integration.

## Requirements
- Windows 10/11
- Node.js 20.19+ or 22.12+
- Python 3.11+

## 1. Start the backend (PowerShell)
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```
Backend health: http://127.0.0.1:8000/api/health
API docs: http://127.0.0.1:8000/docs

## 2. Start the frontend (new PowerShell window)
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## 3. Optional local AI (no paid API)
The app works in demo mode by default. For local model responses:
1. Install Ollama for Windows from https://ollama.com/download
2. In another terminal, download a small model suitable for CPU testing, for example: `ollama pull qwen2.5:1.5b`
3. Start Ollama (normally it runs as a background service).
4. Edit `backend/.env`:
   `AI_PROVIDER=ollama`
   `OLLAMA_MODEL=qwen2.5:1.5b`
5. Restart FastAPI.

With 16 GB RAM and no dedicated GPU, start with a small quantized model. CPU responses may be slow. Do not attempt full model pretraining on this computer.

## Configuration
`backend/.env.example` documents the supported settings. The Ollama service is accessed only by the backend; never expose it directly to the public internet.

## Current milestone scope
- Responsive chat interface
- Create and switch conversations
- SQLite persistence for conversations and messages
- FastAPI chat endpoint
- Demo mode and optional local Ollama model
- Health endpoint and API docs

Not yet included: production authentication, multi-user isolation, admin panel, RAG, file uploads, image generation, voice, cloud deployment, or model fine-tuning. These are later milestones and must be added with security review.

## Project structure
```text
alizariz-ai/
  frontend/   React + TypeScript + Vite
  backend/    FastAPI + SQLite + Ollama adapter
```
