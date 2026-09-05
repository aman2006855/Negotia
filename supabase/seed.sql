-- ============================================================================
-- NEGOTIA — Seed Data (run after schema.sql + schema_v2.sql)
-- Provides demo users, jobs, and sample data for testing
-- ============================================================================

-- Demo users (passwords are hashed via Supabase Auth; these are placeholder profiles)
-- After Supabase Auth signup, profiles are created via triggers.
-- For manual seeding, use the service_role key or run in SQL Editor.

-- Client
insert into users (id, email, name, role, avatar_url, skills, portfolio_links, past_work,
  total_earnings_cents, completed_jobs, active_jobs, rating, review_count, profile_completed, created_at)
values (
  'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'client@demo.dev',
  'Ava Chen',
  'CLIENT',
  null,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  0,
  6,
  2,
  4.90,
  4,
  true,
  now() - interval '30 days'
) on conflict (id) do nothing;

-- Freelancer 1
insert into users (id, email, name, role, avatar_url, skills, capabilities, experience, portfolio_links, past_work,
  total_earnings_cents, completed_jobs, active_jobs, rating, review_count, profile_completed, created_at)
values (
  'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'freelancer@demo.dev',
  'Sam Rivera',
  'FREELANCER',
  null,
  '["React","TypeScript","Node.js","PostgreSQL","Tailwind CSS","Next.js"]'::jsonb,
  'Full-stack web apps, REST APIs, React dashboards, real-time systems',
  '3+',
  '[{"label":"GitHub","url":"https://github.com/samrivera"},{"label":"Portfolio","url":"https://samrivera.dev"}]'::jsonb,
  '[{"title":"E-commerce Platform Migration","description":"Migrated Shopify store to custom Next.js solution"},{"title":"Real-time Analytics Dashboard","description":"Built with React, D3.js, and WebSocket"}]'::jsonb,
  1245000,
  8,
  1,
  4.80,
  6,
  true,
  now() - interval '90 days'
) on conflict (id) do nothing;

-- Freelancer 2
insert into users (id, email, name, role, avatar_url, skills, capabilities, experience, portfolio_links, past_work,
  total_earnings_cents, completed_jobs, active_jobs, rating, review_count, profile_completed, created_at)
values (
  'f2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'jordan@demo.dev',
  'Jordan Kim',
  'FREELANCER',
  null,
  '["Figma","UI/UX Design","React","CSS","Framer Motion"]'::jsonb,
  'Design systems, mobile UI, interactive prototypes, brand identity',
  '1-3',
  '[{"label":"Dribbble","url":"https://dribbble.com/jordankim"},{"label":"Behance","url":"https://behance.net/jordankim"}]'::jsonb,
  '[{"title":"SaaS Dashboard Redesign","description":"Complete UI overhaul for B2B SaaS platform"}]'::jsonb,
  890000,
  5,
  0,
  4.60,
  4,
  true,
  now() - interval '60 days'
) on conflict (id) do nothing;

-- Demo jobs
insert into jobs (id, client_id, title, description, budget_cents, agreement_text, status, created_at)
values
  ('j1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'Design a mobile onboarding flow',
   'Create 4-5 screen mobile onboarding flow with illustrations, progress indicators, and a final CTA. Figma handoff included. Must be accessible (WCAG 2.1 AA).',
   180000,
   'Payment on delivery. 2 revision rounds included. NDA required before project start.',
   'OPEN',
   now() - interval '1 hour'),
  ('j2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'Build a REST API for a booking system',
   'Node.js/Express REST API for appointment booking. Features: user auth (JWT), availability slots, booking CRUD, email notifications, rate limiting.',
   320000,
   'Payment on delivery. Code reviews required at each phase. Source files transferred upon final payment.',
   'OPEN',
   now() - interval '2 hours'),
  ('j4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'Write technical documentation for API',
   'Comprehensive API documentation with examples, error codes, authentication guides, and SDK snippets. OpenAPI/Swagger format preferred.',
   95000,
   'Payment on delivery. Documentation must pass review. 1 round of revisions included.',
   'OPEN',
   now() - interval '30 minutes'),
  ('j6a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'Design brand identity for SaaS startup',
   'Logo design, color palette, typography system, and brand guidelines document. Must work across web, mobile, and print.',
   250000,
   'Payment on delivery. 3 revision rounds included. Final deliverables in Figma + PDF.',
   'OPEN',
   now() - interval '90 minutes')
on conflict (id) do nothing;

-- Completed job (for review seeding)
insert into jobs (id, client_id, freelancer_id, title, description, budget_cents, agreement_text, status, created_at, closed_at)
values (
  'j5a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'Set up CI/CD pipeline with GitHub Actions',
   'Configure automated testing, building, and deployment pipeline. Docker containerization, staging and production environments.',
   150000,
   'Payment on delivery. All tests must pass before deployment.',
   'COMPLETED',
   now() - interval '172 days',
   now() - interval '150 days'
) on conflict (id) do nothing;

-- Active negotiation (for testing the negotiation chat)
insert into negotiations (id, job_id, client_id, freelancer_id, outcome, last_activity_at, created_at)
values (
  'n1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'j3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  null,
  now() - interval '5 minutes',
  now() - interval '10 minutes'
) on conflict (id) do nothing;

-- Also lock the job for the negotiation
update jobs set
  status = 'NEGOTIATING',
  freelancer_id = 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  locked_at = now() - interval '10 minutes'
where id = 'j3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c';

-- Sample negotiation messages
insert into negotiation_messages (negotiation_id, sender_id, body, created_at)
values
  ('n1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'Hi! I saw your job post for the React migration. I have 5 years of experience with React and have done similar jQuery migrations before.',
   now() - interval '8 minutes'),
  ('n1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'Great! Can you tell me about your approach? We have about 15 pages with complex data tables.',
   now() - interval '7 minutes'),
  ('n1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'I would start with the core layout and auth, then migrate page by page. Each table gets its own component with proper typing. I typically use TanStack Table for complex grids.',
   now() - interval '6 minutes'),
  ('n1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
   'That sounds like a solid plan. What about the charts? We use Chart.js currently.',
   now() - interval '5 minutes');

-- Sample review
insert into reviews (project_id, job_id, client_id, freelancer_id, rating, comment, created_at)
values (
  'p-seed-1',
  'j5a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  5,
  'Excellent work on the CI/CD pipeline. Sam set up everything perfectly with automated testing and deployment. Highly recommend!',
  now() - interval '30 days'
) on conflict (id) do nothing;
