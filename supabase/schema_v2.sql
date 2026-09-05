-- ============================================================================
-- NEGOTIA — Schema v2 (Incremental patch)
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================================

-- 1. Enable pg_cron extension (for lock TTL release)
create extension if not exists pg_cron;

-- 2. Trigger: bump negotiations.last_activity_at on every new message
create or replace function bump_negotiation_activity()
returns trigger as $$
begin
  update negotiations
  set last_activity_at = now()
  where id = new.negotiation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_negotiation_message_insert on negotiation_messages;

create trigger on_negotiation_message_insert
  after insert on negotiation_messages
  for each row
  execute function bump_negotiation_activity();

-- 3. Function: release expired locks (15 min inactivity TTL)
create or replace function release_expired_locks()
returns void as $$
declare
  v_neg record;
begin
  for v_neg in
    select id, job_id
    from negotiations
    where outcome is null
      and last_activity_at < now() - interval '15 minutes'
  loop
    -- Expire the negotiation
    update negotiations set
      outcome = 'EXPIRED',
      closed_at = now(),
      abandoned_at = now()
    where id = v_neg.id;

    -- Release the job lock
    update jobs set
      status = 'OPEN',
      freelancer_id = null,
      locked_at = null
    where id = v_neg.job_id
      and status = 'NEGOTIATING';

    raise notice 'Released expired lock: negotiation=%, job=%', v_neg.id, v_neg.job_id;
  end loop;
end;
$$ language plpgsql security definer;

-- 4. pg_cron: run every minute
select cron.schedule(
  'release-expired-negotiations',
  '* * * * *',
  $$select release_expired_locks()$$
);

-- 5. Add negotiations to realtime publication (for accept/decline live events)
alter publication supabase_realtime add table negotiations;
