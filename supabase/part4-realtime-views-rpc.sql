-- ============================================================================
-- NEGOTIA — Part 4 of 4: REALTIME + VIEWS + RPC FUNCTIONS
-- ============================================================================
-- Copy this entire block → Paste in Supabase SQL Editor → Run
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['jobs','workspace_messages','negotiation_messages','projects','milestones','negotiations']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

create or replace view public.freelancer_feed as
select j.id, j.title, j.description, j.budget_cents, j.status, j.created_at,
  u.name as client_name, u.id as client_id
from jobs j join users u on u.id = j.client_id
where j.status = 'OPEN'
order by j.created_at desc;

create or replace view public.user_dashboard_stats as
select u.id as user_id, u.role, u.total_earnings_cents, u.completed_jobs,
  u.active_jobs, u.rating, u.review_count,
  (select count(*) from jobs j where j.client_id = u.id and j.status = 'OPEN') as open_listings,
  (select count(*) from jobs j where j.client_id = u.id and j.status = 'NEGOTIATING') as negotiating_count,
  (select count(*) from projects p where p.client_id = u.id and p.status in ('IN_PROGRESS','IN_REVIEW')) as ongoing_projects,
  (select count(*) from projects p where p.freelancer_id = u.id and p.status in ('IN_PROGRESS','IN_REVIEW')) as active_freelance_projects
from users u;

create or replace view public.freelancer_profile as
select u.id, u.name, u.avatar_url, u.skills, u.capabilities, u.experience,
  u.portfolio_links, u.past_work, u.rating, u.review_count, u.completed_jobs, u.created_at
from users u where u.role = 'FREELANCER';

create or replace function lock_job(p_job_id uuid, p_freelancer_id uuid)
returns json as $$
declare
  v_job record;
  v_negotiation_id uuid;
begin
  update jobs set status = 'NEGOTIATING', freelancer_id = p_freelancer_id, locked_at = now()
  where id = p_job_id and status = 'OPEN' and freelancer_id is null
  returning * into v_job;

  if v_job is null then
    return json_build_object('ok', false, 'error', 'JOB_TAKEN');
  end if;

  insert into negotiations (job_id, client_id, freelancer_id)
  values (p_job_id, v_job.client_id, p_freelancer_id)
  returning id into v_negotiation_id;

  return json_build_object('ok', true, 'negotiation_id', v_negotiation_id, 'job', row_to_json(v_job));
end;
$$ language plpgsql security definer;

create or replace function decline_negotiation(p_negotiation_id uuid, p_user_id uuid)
returns json as $$
declare
  v_negotiation record;
begin
  select * into v_negotiation from negotiations
  where id = p_negotiation_id
  and (client_id = p_user_id or freelancer_id = p_user_id)
  and outcome is null;

  if v_negotiation is null then
    return json_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;

  update negotiations set outcome = 'DECLINED', closed_at = now() where id = p_negotiation_id;
  update jobs set status = 'OPEN', freelancer_id = null, locked_at = null where id = v_negotiation.job_id;

  return json_build_object('ok', true);
end;
$$ language plpgsql security definer;

create or replace function accept_negotiation(p_negotiation_id uuid, p_user_id uuid)
returns json as $$
declare
  v_negotiation record;
  v_job record;
  v_project_id uuid;
begin
  select * into v_negotiation from negotiations
  where id = p_negotiation_id
  and (client_id = p_user_id or freelancer_id = p_user_id)
  and outcome is null;

  if v_negotiation is null then
    return json_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;

  select * into v_job from jobs where id = v_negotiation.job_id;

  update negotiations set outcome = 'ACCEPTED', closed_at = now() where id = p_negotiation_id;
  update jobs set status = 'IN_PROGRESS', closed_at = now() where id = v_negotiation.job_id;

  insert into projects (job_id, title, description, budget_cents, agreement_text, client_id, freelancer_id)
  values (v_job.id, v_job.title, v_job.description, v_job.budget_cents, v_job.agreement_text,
    v_negotiation.client_id, v_negotiation.freelancer_id)
  returning id into v_project_id;

  return json_build_object('ok', true, 'project_id', v_project_id);
end;
$$ language plpgsql security definer;

-- ============================================================================
-- SCHEMA DEPLOYED SUCCESSFULLY!
-- ============================================================================
