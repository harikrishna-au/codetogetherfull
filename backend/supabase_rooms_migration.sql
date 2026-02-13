-- Migration: Add rooms table for matchmaking
-- Run this in the Supabase SQL editor

create table if not exists rooms (
  room_id text primary key,
  participant1_id text references users(user_id) on delete set null,
  participant2_id text references users(user_id) on delete set null,
  question_id uuid references questions(id) on delete set null,
  difficulty text not null,
  mode text not null default 'friendly',
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists idx_rooms_status on rooms(status);
create index if not exists idx_rooms_question_id on rooms(question_id);
