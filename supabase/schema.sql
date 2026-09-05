-- ============================================================================
-- NEGOTIA — Supabase PostgreSQL Schema
-- 1-on-1 Freelance Job Board
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to deploy the schema.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. CUSTOM TYPES (ENUMS)
-- ============================================================================

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

-- ============================================================================
-- 3. TABLE CREATIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 USERS
-- ---------------------------------------------------------------------------
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

comment on table users is 'All registered users — clients and freelancers';
comment on column users.auth_provider is 'Authentication method: email, google, or github';
comment on column users.provider_id is 'OAuth provider user ID (e.g. Google sub claim)';
comment on column users.profile_completed is 'Whether user has completed the profile setup step';
comment on column users.skills is 'JSON array of skill strings, e.g. ["React","Node.js"]';
comment on column users.portfolio_links is 'JSON array of {label, url} objects';
comment on column users.past_work is 'JSON array of {title, description} objects';

-- ---------------------------------------------------------------------------
-- 3.2 JOBS
-- ---------------------------------------------------------------------------
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

comment on table jobs is 'Job postings — CORE entity for the 1-on-1 locking mechanism';
comment on column jobs.status is 'OPEN → NEGOTIATING → IN_PROGRESS → COMPLETED | CANCELLED';
comment on column jobs.freelancer_id is 'Set when a freelancer locks the job (CAS-1)';
comment on column jobs.locked_at is 'Timestamp when the freelancer locked the job';

-- ---------------------------------------------------------------------------
-- 3.3 NEGOTIATIONS
-- ---------------------------------------------------------------------------
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

  constraint unique_active_negotiation_per_job
    unique (job_id, outcome)
);

comment on table negotiations is 'Tracks each 1-on-1 negotiation session between a client and freelancer';
comment on column negotiations.outcome is 'NULL = active, ACCEPTED/DECLINED/EXPIRED = closed';

-- ---------------------------------------------------------------------------
-- 3.4 NEGOTIATION MESSAGES (chat during negotiation)
-- ---------------------------------------------------------------------------
create table if not exists negotiation_messages (
  id              uuid primary key default uuid_generate_v4(),
  negotiation_id  uuid not null references negotiations(id) on delete cascade,
  sender_id       uuid not null references users(id) on delete cascade,
  body            text not null check (char_length(body) >= 1 and char_length(body) <= 5000),
  created_at      timestamptz not null default now()
);

comment on table negotiation_messages is 'Chat messages exchanged during the 1-on-1 negotiation phase';

-- ---------------------------------------------------------------------------
-- 3.5 PROJECTS (created after agreement is signed)
-- ---------------------------------------------------------------------------
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

comment on table projects is 'Active projects — created when a negotiation is ACCEPTED and agreement signed';

-- ---------------------------------------------------------------------------
-- 3.6 MILESTONES
-- ---------------------------------------------------------------------------
create table if not exists milestones (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  title           text not null check (char_length(title) >= 1),
  status          milestone_status not null default 'TODO',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table milestones is 'Task/milestone tracker within a project';

-- ---------------------------------------------------------------------------
-- 3.7 WORKSPACE MESSAGES (project discussion)
-- ---------------------------------------------------------------------------
create table if not exists workspace_messages (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  sender_id       uuid not null references users(id) on delete cascade,
  body            text not null check (char_length(body) >= 1 and char_length(body) <= 5000),
  created_at      timestamptz not null default now()
);

comment on table workspace_messages is 'Discussion messages within an active project workspace';

-- ---------------------------------------------------------------------------
-- 3.8 REVIEWS
-- ---------------------------------------------------------------------------
create table if not exists reviews (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  job_id          uuid not null references jobs(id) on delete cascade,
  client_id       uuid not null references users(id) on delete cascade,
  freelancer_id   uuid not null references users(id) on delete cascade,
  rating          integer not null check (rating >= 1 and rating <= 5),
  comment         text not null check (char_length(comment) >= 1),
  created_at      timestamptz not null default now(),

  constraint unique_review_per_project
    unique (project_id, client_id)
);

comment on table reviews is 'Client reviews for freelancers after project completion';

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Users
create index if not exists idx_users_role on users(role);
create index if not exists idx_users_email on users(email);

-- Jobs
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_client_id on jobs(client_id);
create index if not exists idx_jobs_freelancer_id on jobs(freelancer_id);
create index if not exists idx_jobs_status_created on jobs(status, created_at desc);

-- Negotiations
create index if not exists idx_negotiations_job_id on negotiations(job_id);
create index if not exists idx_negotiations_freelancer_id on negotiations(freelancer_id);
create index if not exists idx_negotiations_outcome on negotiations(outcome);
create index if not exists idx_negotiations_last_activity on negotiations(outcome, last_activity_at);

-- Negotiation Messages
create index if not exists idx_negotiation_messages_neg_id on negotiation_messages(negotiation_id, created_at);

-- Projects
create index if not exists idx_projects_client_id on projects(client_id);
create index if not exists idx_projects_freelancer_id on projects(freelancer_id);
create index if not exists idx_projects_status on projects(status);

-- Milestones
create index if not exists idx_milestones_project_id on milestones(project_id, sort_order);

-- Workspace Messages
create index if not exists idx_workspace_messages_project_id on workspace_messages(project_id, created_at);

-- Reviews
create index if not exists idx_reviews_freelancer_id on reviews(freelancer_id);
create index if not exists idx_reviews_job_id on reviews(job_id);

-- ============================================================================
-- 5. TRIGGER FUNCTION — auto-update updated_at
-- ============================================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables with updated_at
create trigger set_updated_at before update on users
  for each row execute function update_updated_at();

create trigger set_updated_at before update on jobs
  for each row execute function update_updated_at();

create trigger set_updated_at before update on projects
  for each row execute function update_updated_at();

create trigger set_updated_at before update on milestones
  for each row execute function update_updated_at();

-- ============================================================================
-- 6. TRIGGER — auto-update user stats on review insert
-- ============================================================================

create or replace function update_user_stats_on_review()
returns trigger as $$
begin
  -- Update freelancer's rating and review count
  update users set
    review_count = review_count + 1,
    rating = (
      select coalesce(round(avg(rating), 2), 0)
      from reviews
      where freelancer_id = NEW.freelancer_id
    )
  where id = NEW.freelancer_id;

  return NEW;
end;
$$ language plpgsql;

create trigger on_review_insert
  after insert on reviews
  for each row execute function update_user_stats_on_review();

-- ============================================================================
-- 7. TRIGGER — auto-update user active_jobs count
-- ============================================================================

create or replace function update_user_active_jobs()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.status in ('NEGOTIATING', 'IN_PROGRESS') then
    update users set active_jobs = active_jobs + 1 where id = NEW.freelancer_id;
  elsif TG_OP = 'UPDATE' then
    -- Freelancer changed
    if OLD.freelancer_id is distinct from NEW.freelancer_id then
      if OLD.freelancer_id is not null then
        update users set active_jobs = active_jobs - 1 where id = OLD.freelancer_id;
      end if;
      if NEW.freelancer_id is not null and NEW.status in ('NEGOTIATING', 'IN_PROGRESS') then
        update users set active_jobs = active_jobs + 1 where id = NEW.freelancer_id;
      end if;
    -- Status changed
    elsif OLD.status is distinct from NEW.status then
      if NEW.status in ('COMPLETED', 'CANCELLED') and OLD.status in ('NEGOTIATING', 'IN_PROGRESS') then
        update users set active_jobs = active_jobs - 1, completed_jobs = completed_jobs + 1 where id = NEW.freelancer_id;
      end if;
    end if;
  elsif TG_OP = 'DELETE' and OLD.status in ('NEGOTIATING', 'IN_PROGRESS') then
    update users set active_jobs = active_jobs - 1 where id = OLD.freelancer_id;
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger on_job_status_change
  after insert or update or delete on jobs
  for each row execute function update_user_active_jobs();

-- ============================================================================
-- 8. TRIGGER — update user earnings on project completion
-- ============================================================================

create or replace function update_user_earnings_on_complete()
returns trigger as $$
begin
  if NEW.status = 'COMPLETED' and (OLD.status is null or OLD.status != 'COMPLETED') then
    update users set
      total_earnings_cents = total_earnings_cents + NEW.budget_cents,
      active_jobs = active_jobs - 1,
      completed_jobs = completed_jobs + 1
    where id = NEW.freelancer_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_project_complete
  after update on projects
  for each row execute function update_user_earnings_on_complete();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table users enable row level security;
alter table jobs enable row level security;
alter table negotiations enable row level security;
alter table negotiation_messages enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table workspace_messages enable row level security;
alter table reviews enable row level security;

-- ---------------------------------------------------------------------------
-- 9.1 USERS — RLS Policies
-- ---------------------------------------------------------------------------

-- Anyone can read basic user info (for display purposes)
create policy "Users: Public read"
  on users for select
  using (true);

-- Users can only update their own profile
create policy "Users: Update own profile"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own record (signup)
create policy "Users: Insert own record"
  on users for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 9.2 JOBS — RLS Policies
-- ---------------------------------------------------------------------------

-- Anyone can read OPEN jobs (for the feed)
create policy "Jobs: Public read for open jobs"
  on jobs for select
  using (status = 'OPEN');

-- Clients can read their own jobs (any status)
create policy "Jobs: Client reads own jobs"
  on jobs for select
  using (client_id = auth.uid());

-- Freelancers can read jobs they are locked to
create policy "Jobs: Freelancer reads locked jobs"
  on jobs for select
  using (freelancer_id = auth.uid());

-- Clients can insert jobs (only their own)
create policy "Jobs: Client creates jobs"
  on jobs for insert
  with check (client_id = auth.uid());

-- Clients can update their own jobs
create policy "Jobs: Client updates own jobs"
  on jobs for update
  using (client_id = auth.uid());

-- System can update job status (for locking mechanism)
-- Note: In Supabase, you may need a service_role key for the locking endpoint
-- This policy allows the freelancer to lock a job
create policy "Jobs: Freelancer can lock open jobs"
  on jobs for update
  using (status = 'OPEN' and freelancer_id is null)
  with check (freelancer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9.3 NEGOTIATIONS — RLS Policies
-- ---------------------------------------------------------------------------

-- Users can read negotiations they are part of
create policy "Negotiations: Read own negotiations"
  on negotiations for select
  using (client_id = auth.uid() or freelancer_id = auth.uid());

-- System creates negotiations (via service_role or edge function)
create policy "Negotiations: Insert via service"
  on negotiations for insert
  with check (true);

-- Users can update negotiations they are part of (for decline/accept)
create policy "Negotiations: Update own negotiations"
  on negotiations for update
  using (client_id = auth.uid() or freelancer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9.4 NEGOTIATION MESSAGES — RLS Policies
-- ---------------------------------------------------------------------------

-- Users can read messages in negotiations they are part of
create policy "Negotiation Messages: Read own"
  on negotiation_messages for select
  using (
    exists (
      select 1 from negotiations
      where negotiations.id = negotiation_messages.negotiation_id
      and (negotiations.client_id = auth.uid() or negotiations.freelancer_id = auth.uid())
    )
  );

-- Users can send messages in negotiations they are part of
create policy "Negotiation Messages: Insert own"
  on negotiation_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from negotiations
      where negotiations.id = negotiation_messages.negotiation_id
      and (negotiations.client_id = auth.uid() or negotiations.freelancer_id = auth.uid())
      and negotiations.outcome is null
    )
  );

-- ---------------------------------------------------------------------------
-- 9.5 PROJECTS — RLS Policies
-- ---------------------------------------------------------------------------

-- Users can read projects they are part of
create policy "Projects: Read own projects"
  on projects for select
  using (client_id = auth.uid() or freelancer_id = auth.uid());

-- System creates projects (via service_role or edge function)
create policy "Projects: Insert via service"
  on projects for insert
  with check (true);

-- Users can update projects they are part of
create policy "Projects: Update own projects"
  on projects for update
  using (client_id = auth.uid() or freelancer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9.6 MILESTONES — RLS Policies
-- ---------------------------------------------------------------------------

-- Users can read milestones for projects they are part of
create policy "Milestones: Read own"
  on milestones for select
  using (
    exists (
      select 1 from projects
      where projects.id = milestones.project_id
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );

-- Freelancer can manage milestones for their projects
create policy "Milestones: Freelancer manages own"
  on milestones for all
  using (
    exists (
      select 1 from projects
      where projects.id = milestones.project_id
      and projects.freelancer_id = auth.uid()
    )
  );

-- Client can read milestones
create policy "Milestones: Client reads own"
  on milestones for select
  using (
    exists (
      select 1 from projects
      where projects.id = milestones.project_id
      and projects.client_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 9.7 WORKSPACE MESSAGES — RLS Policies
-- ---------------------------------------------------------------------------

-- Users can read messages for projects they are part of
create policy "Workspace Messages: Read own"
  on workspace_messages for select
  using (
    exists (
      select 1 from projects
      where projects.id = workspace_messages.project_id
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );

-- Users can send messages for projects they are part of
create policy "Workspace Messages: Insert own"
  on workspace_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from projects
      where projects.id = workspace_messages.project_id
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 9.8 REVIEWS — RLS Policies
-- ---------------------------------------------------------------------------

-- Anyone can read reviews (for freelancer profiles)
create policy "Reviews: Public read"
  on reviews for select
  using (true);

-- Client can insert review for their own project
create policy "Reviews: Client inserts own"
  on reviews for insert
  with check (
    client_id = auth.uid() and
    exists (
      select 1 from projects
      where projects.id = reviews.project_id
      and projects.client_id = auth.uid()
      and projects.status = 'COMPLETED'
    )
  );

-- Client can update their own review
create policy "Reviews: Client updates own"
  on reviews for update
  using (client_id = auth.uid());

-- ============================================================================
-- 10. REALTIME — Enable Supabase Realtime
-- ============================================================================

-- Enable realtime for jobs (so freelancers see new jobs instantly)
alter publication supabase_realtime add table jobs;

-- Enable realtime for workspace messages (live project chat)
alter publication supabase_realtime add table workspace_messages;

-- Enable realtime for negotiation messages (live negotiation chat)
alter publication supabase_realtime add table negotiation_messages;

-- Enable realtime for projects (status updates)
alter publication supabase_realtime add table projects;

-- Enable realtime for milestones (live task updates)
alter publication supabase_realtime add table milestones;

-- ============================================================================
-- 11. HELPER VIEWS
-- ============================================================================

-- View: Freelancer feed (only OPEN jobs)
create or replace view public.freelancer_feed as
select
  j.id,
  j.title,
  j.description,
  j.budget_cents,
  j.status,
  j.created_at,
  u.name as client_name,
  u.id as client_id
from jobs j
join users u on u.id = j.client_id
where j.status = 'OPEN'
order by j.created_at desc;

-- View: Dashboard stats for a user
create or replace view public.user_dashboard_stats as
select
  u.id as user_id,
  u.role,
  u.total_earnings_cents,
  u.completed_jobs,
  u.active_jobs,
  u.rating,
  u.review_count,
  (select count(*) from jobs j where j.client_id = u.id and j.status = 'OPEN') as open_listings,
  (select count(*) from jobs j where j.client_id = u.id and j.status = 'NEGOTIATING') as negotiating_count,
  (select count(*) from projects p where p.client_id = u.id and p.status in ('IN_PROGRESS', 'IN_REVIEW')) as ongoing_projects,
  (select count(*) from projects p where p.freelancer_id = u.id and p.status in ('IN_PROGRESS', 'IN_REVIEW')) as active_freelance_projects
from users u;

-- View: Freelancer public profile
create or replace view public.freelancer_profile as
select
  u.id,
  u.name,
  u.avatar_url,
  u.skills,
  u.capabilities,
  u.experience,
  u.portfolio_links,
  u.past_work,
  u.rating,
  u.review_count,
  u.completed_jobs,
  u.created_at
from users u
where u.role = 'FREELANCER';

-- ============================================================================
-- 12. RPC FUNCTIONS (for Supabase Edge Functions / Client)
-- ============================================================================

-- Function: Lock a job (CAS-1 atomic operation)
create or replace function lock_job(p_job_id uuid, p_freelancer_id uuid)
returns json as $$
declare
  v_job record;
  v_negotiation_id uuid;
begin
  -- Atomic lock: only if OPEN and not locked
  update jobs set
    status = 'NEGOTIATING',
    freelancer_id = p_freelancer_id,
    locked_at = now()
  where id = p_job_id
  and status = 'OPEN'
  and freelancer_id is null
  returning * into v_job;

  if v_job is null then
    return json_build_object('ok', false, 'error', 'JOB_TAKEN');
  end if;

  -- Create negotiation
  insert into negotiations (job_id, client_id, freelancer_id)
  values (p_job_id, v_job.client_id, p_freelancer_id)
  returning id into v_negotiation_id;

  return json_build_object(
    'ok', true,
    'negotiation_id', v_negotiation_id,
    'job', row_to_json(v_job)
  );
end;
$$ language plpgsql security definer;

-- Function: Decline negotiation (release lock)
create or replace function decline_negotiation(p_negotiation_id uuid, p_user_id uuid)
returns json as $$
declare
  v_negotiation record;
begin
  -- Verify user is part of this negotiation
  select * into v_negotiation from negotiations
  where id = p_negotiation_id
  and (client_id = p_user_id or freelancer_id = p_user_id)
  and outcome is null;

  if v_negotiation is null then
    return json_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;

  -- Update negotiation outcome
  update negotiations set
    outcome = 'DECLINED',
    closed_at = now()
  where id = p_negotiation_id;

  -- Release job lock
  update jobs set
    status = 'OPEN',
    freelancer_id = null,
    locked_at = null
  where id = v_negotiation.job_id;

  return json_build_object('ok', true);
end;
$$ language plpgsql security definer;

-- Function: Accept negotiation & create project
create or replace function accept_negotiation(p_negotiation_id uuid, p_user_id uuid)
returns json as $$
declare
  v_negotiation record;
  v_job record;
  v_project_id uuid;
begin
  -- Verify user is part of this negotiation
  select * into v_negotiation from negotiations
  where id = p_negotiation_id
  and (client_id = p_user_id or freelancer_id = p_user_id)
  and outcome is null;

  if v_negotiation is null then
    return json_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;

  -- Get job details
  select * into v_job from jobs where id = v_negotiation.job_id;

  -- Update negotiation
  update negotiations set
    outcome = 'ACCEPTED',
    closed_at = now()
  where id = p_negotiation_id;

  -- Update job status
  update jobs set
    status = 'IN_PROGRESS',
    closed_at = now()
  where id = v_negotiation.job_id;

  -- Create project
  insert into projects (job_id, title, description, budget_cents, agreement_text, client_id, freelancer_id)
  values (
    v_job.id,
    v_job.title,
    v_job.description,
    v_job.budget_cents,
    v_job.agreement_text,
    v_negotiation.client_id,
    v_negotiation.freelancer_id
  )
  returning id into v_project_id;

  return json_build_object(
    'ok', true,
    'project_id', v_project_id
  );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- DONE — Schema deployed successfully!
-- ============================================================================
