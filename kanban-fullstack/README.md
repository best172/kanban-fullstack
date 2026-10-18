# Full-stack Kanban Board (Supabase + FastAPI + React/Vite)

A starter implementation of the assignment: three columns (To do, Doing, Done), create/move/delete cards, persisted in Supabase, plus a FastAPI backend and React TypeScript frontend.

## 1. Supabase database
1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. Copy the Project URL and service-role key from **Project Settings → API**. Keep the service-role key server-side only.

## 2. Backend
```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
# Fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
uvicorn app:app --reload
```
API docs: http://localhost:8000/docs

## 3. Frontend
In another terminal:
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```
Open the Vite URL printed in terminal.

## API routes
- `GET /api/cards`
- `POST /api/cards` body `{ "title": "..." }`
- `PATCH /api/cards/{id}` body `{ "status": "todo|doing|done" }`
- `DELETE /api/cards/{id}`
- `GET /health`

## Deploy
- Backend: deploy `backend` to Cloud Run (Dockerfile included). Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CORS_ORIGINS` as environment variables.
- Frontend: deploy `frontend` as a Cloudflare Pages project; build command `npm run build`, output directory `dist`. Set `VITE_API_URL` to the public backend URL.
- Supabase: hosted database is already cloud-based.
- Do not expose the Supabase service-role key in frontend environment variables.

This generated project is a working scaffold, but cloud deployment requires your own Supabase/Cloudflare/GCP accounts and credentials. No deployment was performed from this environment.
