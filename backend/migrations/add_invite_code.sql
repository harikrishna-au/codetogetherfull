-- B4: Private rooms — invite code for challenge-a-friend flow
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS invite_code VARCHAR(8) UNIQUE;

-- Only index non-null codes (pending private rooms)
CREATE UNIQUE INDEX IF NOT EXISTS rooms_invite_code_idx
  ON rooms(invite_code)
  WHERE invite_code IS NOT NULL;
