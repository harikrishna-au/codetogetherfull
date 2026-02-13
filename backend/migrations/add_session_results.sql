-- Migration: Add session results columns to session_history table
-- Date: 2026-02-13
-- Description: Enhance session_history to store comprehensive session results including test results, runtime, code, and end reason

-- Add new columns to session_history table
ALTER TABLE session_history 
ADD COLUMN IF NOT EXISTS test_cases_passed INTEGER,
ADD COLUMN IF NOT EXISTS total_test_cases INTEGER,
ADD COLUMN IF NOT EXISTS runtime_ms INTEGER,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS final_code TEXT,
ADD COLUMN IF NOT EXISTS mode TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS end_reason TEXT; -- 'timer-expired', 'both-submitted', 'partner-exit', 'user-exit'

-- Add index for querying by end_reason
CREATE INDEX IF NOT EXISTS idx_session_history_end_reason ON session_history(end_reason);

-- Add index for querying by room_id (for fetching both participants' results)
CREATE INDEX IF NOT EXISTS idx_session_history_room_id ON session_history(room_id);

-- Add comment to document end_reason values
COMMENT ON COLUMN session_history.end_reason IS 'Reason for session end: timer-expired, both-submitted, partner-exit, user-exit';
