-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table if not exists users (
  user_id text primary key, -- Clerk User ID
  email text unique not null,
  display_name text,
  created_at timestamptz default now(),
  last_login timestamptz default now(),
  preferences jsonb default '{}'::jsonb
);

-- User States Table (for real-time tracking)
create table if not exists user_states (
  user_id text primary key references users(user_id) on delete cascade,
  state text not null default 'idle', -- 'idle', 'waiting', 'matched', 'in-session'
  room_id text,
  mode text,
  difficulty text,
  last_active timestamptz default now(),
  is_active boolean default true,
  queue_joined_at timestamptz,
  socket_id text
);

-- Completed Questions Table
create table if not exists completed_questions (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(user_id) on delete cascade,
  question_id text not null,
  completed_at timestamptz default now(),
  unique(user_id, question_id)
);

-- Session History Table
create table if not exists session_history (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(user_id) on delete cascade,
  room_id text not null,
  question_id text not null,
  completed_at timestamptz default now(),
  duration integer, -- in seconds
  partner_id text
);

-- Indexes for performance
create index if not exists idx_user_states_state on user_states(state);
create index if not exists idx_user_states_is_active on user_states(is_active);
create index if not exists idx_user_states_last_active on user_states(last_active);

-- Questions Table
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  examples jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '[]'::jsonb,
  starter_code jsonb not null default '{}'::jsonb,
  tags text[] default '{}',
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Test Cases Table
create table if not exists test_cases (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade,
  input jsonb not null,
  expected_output jsonb not null,
  is_hidden boolean default false,
  created_at timestamptz default now()
);

-- Indexes for questions and test_cases
create index if not exists idx_questions_difficulty on questions(difficulty);
create index if not exists idx_questions_category on questions(category);
create index if not exists idx_test_cases_question_id on test_cases(question_id);
create index if not exists idx_test_cases_is_hidden on test_cases(is_hidden);
