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

## Setup

```bash
# Backend
cd backend && npm install
cp .env.example .env   # then fill in rotated secrets
npm run dev
```
