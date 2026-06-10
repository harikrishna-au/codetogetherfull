-- Migration: Add Elo rating columns to users
-- Date: 2026-06-10
-- Description: Standard Elo rating for challenge mode (B1). Friendly/private
--              matches are unrated. K=40 for the first 10 rated games, 20 after.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN IF NOT EXISTS rated_games_played INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS peak_rating INTEGER NOT NULL DEFAULT 1200;

-- Leaderboard queries sort by rating
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);

COMMENT ON COLUMN users.rating IS 'Elo rating, challenge mode only (default 1200).';
COMMENT ON COLUMN users.rated_games_played IS 'Completed rated games; drives K-factor (40 first 10 games, then 20).';
COMMENT ON COLUMN users.peak_rating IS 'Highest rating ever reached.';
