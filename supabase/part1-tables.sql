-- ============================================================================
-- NEGOTIA — Part 1 of 4: EXTENSIONS + ENUMS + TABLES
-- ============================================================================
-- Copy this entire block → Paste in Supabase SQL Editor → Run
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('CLIENT', 'FREELANCER');
  end if;
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type job_status as enum ('OPEN', 'NEGOTIATING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type project_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');
  end if;
  if not exists (select 1 from pg_type where typname = 'milestone_status') then
    create type milestone_status as enum ('TODO', 'IN_PROGRESS', 'DONE');
  end if;
  if not exists (select 1 from pg_type where typname = 'negotiation_outcome') then
    create type negotiation_outcome as enum ('ACCEPTED', 'DECLINED', 'EXPIRED');
  end if;
end $$;

create table if not exists users (
  id              uuid primary key default uuid_generate_v4(),
  email           text unique not null,
  name            text not null,
  password_hash   text,
  auth_provider   text not null default 'email' check (auth_provider in ('email', 'google', 'github')),
  provider_id     text,
  role            user_role not null default 'FREELANCER',
  avatar_url      text,
  skills          jsonb not null default '[]'::jsonb,
  capabilities    text,
  experience      text check (experience in ('0-1', '1-3', '3+')),
  portfolio_links jsonb not null default '[]'::jsonb,
  past_work       jsonb not null default '[]'::jsonb,
  total_earnings_cents  integer not null default 0 check (total_earnings_cents >= 0),
  completed_jobs  integer not null default 0 check (completed_jobs >= 0),
  active_jobs     integer not null default 0 check (active_jobs >= 0),
  rating          numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count    integer not null default 0 check (review_count >= 0),
  profile_completed boolean not null default false,
  is_online       boolean not null default false,
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint valid_oauth_user
    check (
      (auth_provider = 'email' and password_hash is not null) or
      (auth_provider in ('google', 'github'))
    )
);

create table if not exists jobs (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references users(id) on delete cascade,
  title           text not null check (char_length(title) >= 4 and char_length(title) <= 200),
  description     text not null check (char_length(description) >= 10),
  budget_cents    integer not null check (budget_cents > 0),
  agreement_text  text not null check (char_length(agreement_text) >= 20),
  status          job_status not null default 'OPEN',
  freelancer_id   uuid references users(id) on delete set null,
  locked_at       timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists negotiations (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references jobs(id) on delete cascade,
  client_id       uuid not null references users(id) on delete cascade,
  freelancer_id   uuid not null references users(id) on delete cascade,
  outcome         negotiation_outcome,
  created_at      timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  abandoned_at    timestamptz,
  closed_at       timestamptz,
  constraint unique_active_negotiation_per_job unique (job_id, outcome)
);

create table if not exists negotiation_messages (
  id              uuid primary key default uuid_generate_v4(),
  negotiation_id  uuid not null references negotiations(id) on delete cascade,
  sender_id       uuid not null references users(id) on delete cascade,
  body            text not null check (char_length(body) >= 1 and char_length(body) <= 5000),
  created_at      timestamptz not null default now()
);

create table if not exists projects (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid unique not null references jobs(id) on delete cascade,
  title           text not null,
  description     text not null,
  budget_cents    integer not null check (budget_cents > 0),
  agreement_text  text not null,
  status          project_status not null default 'NOT_STARTED',
  progress        integer not null default 0 check (progress >= 0 and progress <= 100),
  client_id       uuid not null references users(id) on delete cascade,
  freelancer_id   uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists milestones (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  title           text not null check (char_length(title) >= 1),
  status          milestone_status not null default 'TODO',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists workspace_messages (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  sender_id       uuid not null references users(id) on delete cascade,
  body            text not null check (char_length(body) >= 1 and char_length(body) <= 5000),
  created_at      timestamptz not null default now()
);

create table if not exists reviews (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  job_id          uuid not null references jobs(id) on delete cascade,
  client_id       uuid not null references users(id) on delete cascade,
  freelancer_id   uuid not null references users(id) on delete cascade,
  rating          integer not null check (rating >= 1 and rating <= 5),
  comment         text not null check (char_length(comment) >= 1),
  created_at      timestamptz not null default now(),
  constraint unique_review_per_project unique (project_id, client_id)
);

-- Part 1 done. Now run Part 2.
