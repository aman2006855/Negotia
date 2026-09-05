-- ============================================================================
-- NEGOTIA — Part 2 of 4: INDEXES + TRIGGERS
-- ============================================================================
-- Copy this entire block → Paste in Supabase SQL Editor → Run
-- ============================================================================

create index if not exists idx_users_role on users(role);
create index if not exists idx_users_email on users(email);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_client_id on jobs(client_id);
create index if not exists idx_jobs_freelancer_id on jobs(freelancer_id);
create index if not exists idx_jobs_status_created on jobs(status, created_at desc);
create index if not exists idx_negotiations_job_id on negotiations(job_id);
create index if not exists idx_negotiations_freelancer_id on negotiations(freelancer_id);
create index if not exists idx_negotiations_outcome on negotiations(outcome);
create index if not exists idx_negotiations_last_activity on negotiations(outcome, last_activity_at);
create index if not exists idx_negotiation_messages_neg_id on negotiation_messages(negotiation_id, created_at);
create index if not exists idx_projects_client_id on projects(client_id);
create index if not exists idx_projects_freelancer_id on projects(freelancer_id);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_milestones_project_id on milestones(project_id, sort_order);
create index if not exists idx_workspace_messages_project_id on workspace_messages(project_id, created_at);
create index if not exists idx_reviews_freelancer_id on reviews(freelancer_id);
create index if not exists idx_reviews_job_id on reviews(job_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on users
  for each row execute function update_updated_at();
create trigger set_updated_at before update on jobs
  for each row execute function update_updated_at();
create trigger set_updated_at before update on projects
  for each row execute function update_updated_at();
create trigger set_updated_at before update on milestones
  for each row execute function update_updated_at();

create or replace function update_user_stats_on_review()
returns trigger as $$
begin
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

create or replace function update_user_active_jobs()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.status in ('NEGOTIATING', 'IN_PROGRESS') then
    update users set active_jobs = active_jobs + 1 where id = NEW.freelancer_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.freelancer_id is distinct from NEW.freelancer_id then
      if OLD.freelancer_id is not null then
        update users set active_jobs = active_jobs - 1 where id = OLD.freelancer_id;
      end if;
      if NEW.freelancer_id is not null and NEW.status in ('NEGOTIATING', 'IN_PROGRESS') then
        update users set active_jobs = active_jobs + 1 where id = NEW.freelancer_id;
      end if;
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

-- Part 2 done. Now run Part 3.
