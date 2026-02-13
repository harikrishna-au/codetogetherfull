-- Migration: Add foreign key constraint to session_history
-- Description: Link session_history.question_id to questions.id for data integrity and PostgREST relationship detection

-- First, convert question_id to UUID (assuming all valid UUIDs or NULL)
-- This is necessary because questions.id is UUID but session_history.question_id was created as TEXT
ALTER TABLE session_history 
ALTER COLUMN question_id TYPE uuid USING question_id::uuid;

ALTER TABLE session_history
ADD CONSTRAINT fk_session_history_questions
FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE SET NULL;
