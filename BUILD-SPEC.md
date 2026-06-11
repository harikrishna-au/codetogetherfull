# CodeTogether Arena — Complete Build Specification
> Hand this entire file to Claude Code (or any coding LLM). Work top-to-bottom by priority. Do not skip P0.

---

## CONTEXT (read first)

You are working on **CodeTogether Arena**, a real-time 1v1 competitive + collaborative coding platform. The repo has three apps:

- `frontend/` — React 18 + Vite + TypeScript. Clerk auth, socket.io-client, Monaco editor, Yjs collaborative editing, WebRTC video/audio, chat, matchmaking UI, profile/stats, session results. Routes: `/`, `/matchmaking`, `/session/:roomId`, `/session/:roomId/results`, `/profile`.
- `backend/` — Node + Express + socket.io + Supabase (Postgres). Clerk SDK + JWT session tokens, socket auth middleware, MatchmakingService (6 in-memory queues: friendly/challenge × easy/medium/hard), SocketService (per-room Y.Doc, chat, timers, win broadcast, reconnect handling), CodeRunner (executes JS/Python/Java/C++ locally via child_process), REST routes: `/api/auth`, `/api/users`, `/api/session`, `/api/questions`, `/api/testcases`, `/api/queue`, `/api/rooms`, `/api/execute`, `/api/active-users`. Runs on port 4000.
- `admin/` — separate Vite app for question CRUD (description, examples, constraints, hints, starter code per language, test cases), queue stats, queue clearing. Talks to `/admin-api/admin`.

Key tables (Supabase): `users`, `user_states` (state/room_id/queue tracking, heartbeat), `rooms` (participants, status, ended_at), `questions`, `test_cases` (is_hidden flag), `session_results`, chat history.

Match flow: user joins queue via socket `joinQueue` → MatchmakingService pairs two users → `matchFound` with roomId + question → both join room → solve in Monaco (independent editors by default; optional Yjs "sync" mode) → `/api/execute` runs code against test cases → first to pass all tests emits `submissionWin` → server ends room, broadcasts `roundWinner` → results page.

**Constraints for all work:**
- TypeScript everywhere, keep existing code style and path aliases (`@/`).
- Do not break existing socket event contracts unless the task says so; if you change one, update both frontend and backend types (`backend/src/types/index.ts`).
- Every new endpoint needs auth middleware + zod/express-validator validation + rate limiting where appropriate.
- Write Jest tests for new backend services. Run `npm run lint` in each app before finishing.
- Never commit secrets.

---

## PART A — CRITICAL BUGS / SECURITY FIXES (P0 — do these first, in order)

### A1. Secrets committed to repo
`backend/.env` is tracked in git and contains Supabase/Clerk/JWT keys.
- Add `.env`, `*.log`, `logs/`, `.DS_Store` to `.gitignore` (root + backend).
- Remove `.env` from git index (`git rm --cached`), create `backend/.env.example` with all required keys documented (read `backend/src/config/env.ts` for the full zod schema of required vars).
- Print a reminder in README that keys must be rotated.

### A2. Unsandboxed code execution (remote code execution risk)
`backend/src/services/codeRunner.ts` executes user-submitted code **directly on the host** via `child_process`, guarded only by a regex blacklist (`validateCodeSafety`). This is trivially bypassable (`require('f'+'s')`, `import()`, Python `__import__`, `getattr`).
**Fix — replace the execution layer with Docker-isolated runs:**
- Create `backend/src/services/sandboxRunner.ts` that runs each submission inside a short-lived Docker container: images `node:20-alpine`, `python:3.12-alpine`, `eclipse-temurin:21-alpine`, `gcc:13` (or a single custom multi-runtime image — your choice, document it).
- Container limits: `--network none`, `--memory 256m`, `--cpus 0.5`, `--pids-limit 64`, read-only bind mount of the code dir, non-root user, 10s hard wall-clock timeout via `docker run --stop-timeout` plus host-side kill.
- Keep the existing public interface of `CodeRunner.execute(input): Promise<ExecuteResult>` exactly the same (same harness generation, signature parsing, hidden-test redaction) so `routes/execute.ts` doesn't change — only swap the process-spawning internals.
- Add env flag `EXECUTION_MODE=docker|local` (default `docker`; `local` only for dev) so dev machines without Docker still work.
- Keep the regex check as defense-in-depth, not as the security boundary.

### A3. Client-trusted win condition (cheating exploit)
In `backend/src/services/SocketService.ts`, the `submissionWin` handler **trusts the client completely** — anyone can open devtools and emit `submissionWin` to instantly win.
**Fix — make the server the source of truth:**
- On every full submission in `routes/execute.ts` (when `visibleOnly` is falsy and `roomId` is present): if `passed === totalTests`, the **server** triggers the win path (end room, stop timer, broadcast `roundWinner`) instead of waiting for the client.
- Store each submission in a new `submissions` table (`id, room_id, user_id, question_id, language, code, passed, total, runtime_ms, created_at`) — needed for history, anti-cheat, and dispute resolution.
- Remove or ignore the client-side `submissionWin` emit (frontend: `CodingSession.tsx` `hasEmittedWin` logic) — keep the `roundWinner` listener.
- Guard against double-wins with a transactional/conditional update: only end the room if `status = 'active'` (use `.eq('status','active')` in the update and check affected rows).

### A4. Match abandonment / forfeit is unhandled
Reconnect logic exists, but if an opponent disconnects and never returns, the remaining player is stuck.
**Fix:**
- On disconnect during an active room, start a 60s grace timer (configurable). If the user doesn't reconnect, end the room with `winner = remaining player`, reason `forfeit`; broadcast `roundWinner` with a `reason: 'forfeit'` field; persist to `session_results`.
- Frontend: show "Opponent disconnected — waiting 60s…" banner in `CodingSession.tsx`, then the win overlay with forfeit messaging.
- Also handle both-players-gone: clean up room, Yjs doc, timer.

### A5. Hidden test case leakage check
`routes/execute.ts` fetches hidden test cases and CodeRunner redacts them in results — verify redaction also strips `error` messages that may embed expected output (assertion text). Sanitize error strings for hidden cases to just `"Hidden test failed"`.

### A6. Queue/state desync on server restart
Queues are in-memory; `user_states` rows in Supabase can say `in_queue` after a restart, leaving ghost users.
**Fix:** on server boot, reset all `user_states` where `state = 'in_queue'` to `idle`; rooms with status `active` older than the max session length get closed (TimerService already has `initializeActiveRoomTimers` — extend it).

### A7. Rate limit the execute endpoint specifically
Global rate limiting exists, but `/api/execute` is expensive. Add a per-user limiter: max 1 concurrent execution + max 10/min per user. Return 429 with a friendly message the frontend surfaces in `ResultsPanel`.

---

## PART B — CORE FEATURES TO IMPLEMENT (P1 — needed to compete)

### B1. ELO rating system
No rating logic exists anywhere. Implement standard Elo:
- New columns on `users` (or new `ratings` table): `rating` (default 1200), `rd`/games_played, `peak_rating`.
- K-factor: 40 for first 10 games, 20 thereafter. Update ratings only for `challenge` mode wins/losses/forfeits (friendly mode unrated).
- Apply rating change server-side inside the win path from A3 (single transaction with room end).
- Return old/new rating in the `roundWinner` payload; show "+18 / −18" animation on the win overlay and results page.
- Add rating + rank tier (Bronze <1100, Silver <1300, Gold <1500, Platinum <1700, Diamond ≥1700) to profile page stats.

### B2. Leaderboard
- Endpoint `GET /api/leaderboard?scope=global&period=all|month|week&limit=50` (cache 60s in memory).
- New frontend route `/leaderboard`: rank, avatar, username, rating, tier, W/L, streak. Highlight the current user's row; link from header + landing page.

### B3. Rating-based matchmaking (challenge mode)
Extend `MatchmakingService`: in challenge queues, only pair players within ±200 rating, widening by +100 every 15s of wait (cap ±600). Friendly mode keeps FIFO pairing. Emit queue position/wait time updates to the client every 5s (`queueStatus` event); show in the matchmaking screen.

### B4. Private rooms / challenge a friend
- Socket events `createPrivateRoom` (returns 6-char invite code + roomId) and `joinPrivateRoom(code)`.
- `rooms` table: add `is_private`, `invite_code`, `difficulty`, `mode` columns.
- Frontend: "Play with a friend" card on `/matchmaking` → create room → shows shareable link `/join/:code` + copy button → friend opens link (after sign-in) and both auto-join the session. Private matches are unrated.
- This is the viral loop — make the link flow seamless.

### B5. Mock Interview mode (differentiator — build it well)
A third mode alongside friendly/challenge: one player is **interviewer**, one is **candidate**.
- Matchmaking: queue pairs by opposite role preference (or "either"); private rooms can also start interview mode.
- Session differences: candidate gets the editor; interviewer gets read-only live view (Yjs sync forced ON, one-way), a private rubric panel (communication / problem solving / code quality / verification, 1–4 scale each + notes), and control of question reveal. Video+audio default ON for both. 35-minute timer.
- End of session: interviewer submits rubric → candidate receives structured feedback on the results page; roles can swap with one click ("rematch swapped").
- Persist to new `interview_feedback` table.

### B6. Anti-cheat basics
- Frontend (`CodingSession.tsx` / `EditorPanel.tsx`): detect large pastes (>200 chars) into Monaco and tab-visibility changes (`visibilitychange`); emit `integrityEvent {type: 'paste'|'blur', size?, ts}` to the server. Store on the submission record (A3 table). 
- Server: flag matches where the winner had a large paste within 60s before winning; mark `session_results.flagged = true`.
- Show a subtle "fair play monitoring is active" note in challenge mode. Do NOT auto-ban — just flag for now.

### B7. Question bank expansion to 100+ problems
- Extend `backend/src/scripts/problemData.ts` from ~26 to 100 problems (write them: title, description, 2–3 examples, constraints, hints, tags, starter code for all 4 languages, 3 visible + 5–8 hidden test cases each). Distribution: 40 easy / 40 medium / 20 hard, covering arrays, strings, hashmaps, two pointers, sliding window, stacks/queues, linked lists, trees, BFS/DFS, binary search, heaps, intervals, DP, graphs, greedy.
- Make `seedProblems.ts` idempotent (upsert by questionId).
- Matchmaking question selection: avoid repeating a question either player has seen in their last 20 sessions (query `session_results`).

### B8. Rematch + post-game flow
After `roundWinner`, both players see "Rematch" (same opponent, new question, same mode) and "New opponent". Rematch requires both to accept within 30s (`rematchRequest`/`rematchAccept` socket events → server creates new room reusing participants).

---

## PART C — IMPORTANT IMPROVEMENTS (P2)

### C1. Scaling: move shared state to Redis
Matchmaking queues, connectedUsers maps, and Yjs docs are in-memory (single instance only).
- Add Redis (ioredis): queues as sorted sets, socket.io Redis adapter for multi-instance pub/sub, Yjs doc persistence snapshots (or y-redis). Feature-flag with `REDIS_URL` (absent = current in-memory behavior).

### C2. Deployment & DevOps
- `Dockerfile` for backend (multi-stage, includes Docker-in-Docker or socket mount strategy for A2 — document the choice), `Dockerfile` for frontend+admin (static nginx), `docker-compose.yml` wiring backend + redis + frontend with env files.
- GitHub Actions: lint + test + build on PR for all three apps.
- Real `README.md` at root: architecture diagram (mermaid), setup steps, env vars, seeding, deployment.

### C3. Session results page hardening
Verify `/session/:roomId/results` handles: refresh after match, viewing old sessions, unauthorized users (not a participant → 403/redirect). Persist final code of both players (from A3 submissions) and show a side-by-side diff viewer on results.

### C4. Spectator-safe room access control
`handleJoinRoom` must reject users who are not room participants (check `rooms.participant1_id/participant2_id`). Currently verify this — if missing, add it. Return clear error → frontend redirects home with toast.

### C5. UX fixes
- Win overlay: add confetti for winner (canvas-confetti is already a dependency), rating delta (B1), rematch buttons (B8).
- Matchmaking page: show estimated wait time + live queue counts per difficulty (endpoint exists: `QUEUE_COUNT`).
- Editor: persist language choice per user (localStorage), warn before navigating away mid-match (beforeunload + react-router blocker).
- Mobile: matchmaking and landing must be usable on mobile; session page can show a "desktop recommended" gate below 900px instead of a broken layout.
- Error states: `/api/execute` failures (timeout, 429, 500) must render readable messages in `ResultsPanel`, never raw errors.

### C6. Profile enhancements
Rating history graph (recharts — line chart of rating over last 50 games), per-topic solved breakdown (use question tags), longest streak, link to full session history with pagination (endpoint supports `limit` — add `offset`).

---

## PART D — NICE-TO-HAVE / LATER (P3 — only after A–C are done)

1. **Tournaments**: 8-player single-elimination brackets, lobby page, scheduled start, bracket visualization.
2. **Puzzle rush / speedrun solo mode**: solve as many ascending-difficulty problems in 10 minutes; solo leaderboard.
3. **AI post-game analysis**: after a match, send the winning + losing solutions to an LLM endpoint for complexity analysis and improvement tips (env-gated, `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`).
4. **"Explain your solution" scoring for interview mode**: record candidate's verbal walkthrough transcript (Web Speech API) and attach to interview feedback.
5. **Achievements/badges**: first win, 5-streak, all-difficulties, polyglot (win in 3 languages), etc.
6. **Spectator mode** for tournament matches (read-only Yjs + delayed view to prevent ghosting).
7. **Email notifications** (rematch invites, tournament reminders) via Resend/SES.
8. **i18n scaffolding** (react-i18next) — English only for now, but extract strings.

---

## EXECUTION ORDER & DEFINITION OF DONE

Work in this order: **A1 → A3 → A4 → A6 → A7 → A2 → A5 → B1 → B2 → B3 → B7 → B4 → B8 → B5 → B6 → C1 → C2 → C3 → C4 → C5 → C6 → D**.
(A2 is the hardest P0; do the quick security wins first, but A2 MUST be done before any public deployment.)

For every task:
1. Read the relevant existing files fully before editing.
2. Update shared types (`backend/src/types/index.ts`) and keep frontend/backend socket contracts in sync.
3. Add/extend SQL migration files in `backend/migrations/` for any schema change (never edit old migrations).
4. Write tests for backend logic (Elo math, matchmaking pairing, forfeit timer, sandbox limits).
5. Lint passes in all touched apps; app boots; a full friendly match works end-to-end (manual smoke: queue → match → solve → win → results → profile updated).
6. Commit per task with message `[A3] Server-authoritative win condition` style prefixes.
