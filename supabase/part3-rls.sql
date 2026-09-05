-- ============================================================================
-- NEGOTIA — Part 3 of 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Copy this entire block → Paste in Supabase SQL Editor → Run
-- ============================================================================

alter table users enable row level security;
alter table jobs enable row level security;
alter table negotiations enable row level security;
alter table negotiation_messages enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table workspace_messages enable row level security;
alter table reviews enable row level security;

create policy "Users: Public read" on users for select using (true);
create policy "Users: Update own profile" on users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users: Insert own record" on users for insert with check (auth.uid() = id);

create policy "Jobs: Public read for open jobs" on jobs for select using (status = 'OPEN');
create policy "Jobs: Client reads own jobs" on jobs for select using (client_id = auth.uid());
create policy "Jobs: Freelancer reads locked jobs" on jobs for select using (freelancer_id = auth.uid());
create policy "Jobs: Client creates jobs" on jobs for insert with check (client_id = auth.uid());
create policy "Jobs: Client updates own jobs" on jobs for update using (client_id = auth.uid());
create policy "Jobs: Freelancer can lock open jobs" on jobs for update
  using (status = 'OPEN' and freelancer_id is null)
  with check (freelancer_id = auth.uid());

create policy "Negotiations: Read own negotiations" on negotiations for select
  using (client_id = auth.uid() or freelancer_id = auth.uid());
create policy "Negotiations: Insert via service" on negotiations for insert with check (true);
create policy "Negotiations: Update own negotiations" on negotiations for update
  using (client_id = auth.uid() or freelancer_id = auth.uid());

create policy "Negotiation Messages: Read own" on negotiation_messages for select
  using (
    exists (
      select 1 from negotiations
      where negotiations.id = negotiation_messages.negotiation_id
      and (negotiations.client_id = auth.uid() or negotiations.freelancer_id = auth.uid())
    )
  );
create policy "Negotiation Messages: Insert own" on negotiation_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from negotiations
      where negotiations.id = negotiation_messages.negotiation_id
      and (negotiations.client_id = auth.uid() or negotiations.freelancer_id = auth.uid())
      and negotiations.outcome is null
    )
  );

create policy "Projects: Read own projects" on projects for select
  using (client_id = auth.uid() or freelancer_id = auth.uid());
create policy "Projects: Insert via service" on projects for insert with check (true);
create policy "Projects: Update own projects" on projects for update
  using (client_id = auth.uid() or freelancer_id = auth.uid());

create policy "Milestones: Read own" on milestones for select
  using (
    exists (
      select 1 from projects
      where projects.id = milestones.project_id
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );
create policy "Milestones: Freelancer manages own" on milestones for all
  using (
    exists (
      select 1 from projects
      where projects.id = milestones.project_id
      and projects.freelancer_id = auth.uid()
    )
  );
create policy "Milestones: Client reads own" on milestones for select
  using (
    exists (
      select 1 from projects
      where projects.id = milestones.project_id
      and projects.client_id = auth.uid()
    )
  );

create policy "Workspace Messages: Read own" on workspace_messages for select
  using (
    exists (
      select 1 from projects
      where projects.id = workspace_messages.project_id
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );
create policy "Workspace Messages: Insert own" on workspace_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from projects
      where projects.id = workspace_messages.project_id
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );

create policy "Reviews: Public read" on reviews for select using (true);
create policy "Reviews: Client inserts own" on reviews for insert
  with check (
    client_id = auth.uid() and
    exists (
      select 1 from projects
      where projects.id = reviews.project_id
      and projects.client_id = auth.uid()
      and projects.status = 'COMPLETED'
    )
  );
create policy "Reviews: Client updates own" on reviews for update using (client_id = auth.uid());

-- Part 3 done. Now run Part 4.
