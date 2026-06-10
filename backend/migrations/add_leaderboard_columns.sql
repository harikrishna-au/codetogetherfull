-- Migration: Add leaderboard counters to users
-- Date: 2026-06-10
-- Description: Denormalized rated-match counters maintained by the server win
--              path (B2). Avoids recomputing W/L from session_history on every
--              leaderboard request.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS rated_wins INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rated_losses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rated_at TIMESTAMPTZ;

-- Period-scoped leaderboards filter on recent rated activity
CREATE INDEX IF NOT EXISTS idx_users_last_rated_at ON users(last_rated_at);

COMMENT ON COLUMN users.rated_wins IS 'Challenge-mode wins (incl. forfeit wins).';
COMMENT ON COLUMN users.rated_losses IS 'Challenge-mode losses (incl. forfeits).';
COMMENT ON COLUMN users.current_streak IS 'Consecutive rated wins; reset to 0 on a loss.';
COMMENT ON COLUMN users.last_rated_at IS 'Timestamp of the most recent rated match.';
