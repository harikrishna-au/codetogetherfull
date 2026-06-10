# CodeTogether Arena

A real-time 1v1 competitive + collaborative coding platform (frontend / backend / admin).

## ⚠️ Security: Rotate your secrets

`backend/.env` was previously committed to git history. **All credentials that were
ever stored in it MUST be rotated immediately**, because they remain visible in the
repository history even after removal:

- **Supabase** — rotate `SUPABASE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → Reset).
- **Clerk** — rotate `CLERK_SECRET_KEY` (Clerk Dashboard → API Keys).
- **JWT** — generate a new `JWT_SECRET` (min 32 chars).

`.env` files are now git-ignored. Copy `backend/.env.example` to `backend/.env` and
fill in the rotated values. Never commit `.env`.

## Code execution sandbox

User-submitted code runs in **Docker-isolated containers** (`EXECUTION_MODE=docker`,
the default): one official image per runtime, no network, 256 MB memory, 0.5 CPU,
64-process limit, read-only code mount, non-root user, 10 s hard timeout.
Pre-pull the images on the host:

```bash
docker pull node:20-alpine python:3.12-alpine eclipse-temurin:21-jdk-alpine gcc:13
```

For development machines without Docker set `EXECUTION_MODE=local` in
`backend/.env` — this executes submissions directly on the host and is **unsafe
for anything public**.

## Setup

```bash
# Backend
cd backend && npm install
cp .env.example .env   # then fill in rotated secrets
npm run dev
```
