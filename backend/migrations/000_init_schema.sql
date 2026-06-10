-- ============================================================================
-- CodeTogether Arena — Full bootstrap schema for a FRESH Supabase project
-- Date: 2026-06-10
--
-- Run this ONCE in the Supabase SQL Editor of a new project. It creates every
-- table the backend uses, already including all incremental migrations in this
-- folder (add_session_results, add_submissions, add_room_end_reason,
-- add_elo_ratings, add_leaderboard_columns) — do NOT run those separately
-- on a database initialized with this file.
--
-- Note on RLS: the backend talks to Supabase with the service-role key and the
-- frontend never queries Supabase directly, so tables are left without RLS
-- policies here. Do not expose the anon key client-side without adding RLS.
-- ============================================================================

-- ── users ───────────────────────────────────────────────────────────────────
-- user_id is the Clerk user id (text, e.g. "user_2ab...")
CREATE TABLE IF NOT EXISTS users (
    user_id            TEXT PRIMARY KEY,
    email              TEXT,
    display_name       TEXT,
    preferences        JSONB NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login         TIMESTAMPTZ,
    -- Elo rating (B1)
    rating             INTEGER NOT NULL DEFAULT 1200,
    rated_games_played INTEGER NOT NULL DEFAULT 0 CHECK (rated_games_played >= 0),
    peak_rating        INTEGER NOT NULL DEFAULT 1200,
    -- Leaderboard counters (B2)
    rated_wins         INTEGER NOT NULL DEFAULT 0,
    rated_losses       INTEGER NOT NULL DEFAULT 0,
    current_streak     INTEGER NOT NULL DEFAULT 0,
    last_rated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_rated_at ON users(last_rated_at);

-- ── user_states ─────────────────────────────────────────────────────────────
-- One row per user: connection, queue and session tracking
CREATE TABLE IF NOT EXISTS user_states (
    user_id         TEXT PRIMARY KEY,
    state           TEXT NOT NULL DEFAULT 'idle',  -- idle | waiting | matched | in-session
    room_id         TEXT,
    mode            TEXT,                          -- friendly | challenge
    difficulty      TEXT,                          -- easy | medium | hard
    socket_id       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    queue_joined_at TIMESTAMPTZ,
    last_active     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_states_state ON user_states(state);

-- ── questions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    difficulty   TEXT NOT NULL,                    -- easy | medium | hard
    examples     JSONB NOT NULL DEFAULT '[]',
    constraints  JSONB NOT NULL DEFAULT '[]',
    hints        JSONB NOT NULL DEFAULT '[]',
    starter_code JSONB NOT NULL DEFAULT '{}',      -- { javascript, python, java, cpp }
    tags         JSONB NOT NULL DEFAULT '[]',
    category     TEXT DEFAULT 'General',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- ── test_cases ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input           JSONB NOT NULL,                -- named args, e.g. {"nums":[1,2],"target":3}
    expected_output JSONB,
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    explanation     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_question_id ON test_cases(question_id);

-- ── rooms ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         TEXT UNIQUE NOT NULL,
    participant1_id TEXT,
    participant2_id TEXT,
    question_id     UUID REFERENCES questions(id),
    status          TEXT NOT NULL DEFAULT 'active', -- active | ended
    mode            TEXT,
    difficulty      TEXT,
    end_reason      TEXT,                           -- submission | forfeit | timer | abandoned
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_participants ON rooms(participant1_id, participant2_id);

-- ── session_history ─────────────────────────────────────────────────────────
-- One row per user per room (upserted on user_id,room_id)
CREATE TABLE IF NOT EXISTS session_history (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT NOT NULL,
    room_id           TEXT NOT NULL,
    question_id       UUID REFERENCES questions(id),
    partner_id        TEXT,
    duration          INTEGER,                      -- seconds
    test_cases_passed INTEGER,
    total_test_cases  INTEGER,
    runtime_ms        INTEGER,
    language          TEXT,
    final_code        TEXT,
    mode              TEXT,
    difficulty        TEXT,
    end_reason        TEXT,
    completed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_session_history_room_id ON session_history(room_id);
CREATE INDEX IF NOT EXISTS idx_session_history_end_reason ON session_history(end_reason);
CREATE INDEX IF NOT EXISTS idx_session_history_user_completed ON session_history(user_id, completed_at DESC);

-- ── completed_questions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS completed_questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT NOT NULL,
    question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_id)
);

-- ── submissions (A3) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    question_id TEXT NOT NULL,
    language    TEXT NOT NULL,
    code        TEXT NOT NULL,
    passed      INTEGER NOT NULL DEFAULT 0,
    total       INTEGER NOT NULL DEFAULT 0,
    is_winner   BOOLEAN NOT NULL DEFAULT FALSE,
    runtime_ms  INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_room_id ON submissions(room_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
