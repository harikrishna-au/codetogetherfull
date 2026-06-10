-- Migration: Add submissions table
-- Date: 2026-06-10
-- Description: Persist every full submission (server-authoritative win condition, A3).
--              Needed for match history, anti-cheat (B6), and dispute resolution.

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

-- Lookups by room (results page, anti-cheat) and by user (history)
CREATE INDEX IF NOT EXISTS idx_submissions_room_id ON submissions(room_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

COMMENT ON TABLE submissions IS 'Every full code submission. Server is the source of truth for wins (A3).';
COMMENT ON COLUMN submissions.is_winner IS 'True if this submission ended the room as the winning submission.';
