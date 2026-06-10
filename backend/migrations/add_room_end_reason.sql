-- Migration: Add end_reason to rooms
-- Date: 2026-06-10
-- Description: Record why a room ended (server-authoritative win path, A3/A4).
--              Values: 'submission' (someone passed all tests), 'forfeit' (opponent
--              abandoned), 'timer' (session time expired).

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS end_reason TEXT;

COMMENT ON COLUMN rooms.end_reason IS 'Why the room ended: submission, forfeit, or timer.';
