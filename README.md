# Freelance Job Board — Exclusive 1-on-1 Negotiation Platform

> **One job. One freelancer. One negotiation at a time.**

A high-performance freelance marketplace where clicking a job **instantly locks it** into a private 1-on-1 chat between the client and that single freelancer. No parallel applications, no competing proposals — just focused negotiation.

---

## 1. What Makes This Different?

| Traditional Job Board | This Platform |
|---|---|
| Many freelancers apply to the same job | First click **locks** the job globally |
| Client sifts through 10–50 proposals | Client negotiates with **one** freelancer at a time |
| No urgency — jobs sit open for days | Jobs are realtime, contested, and resolved quickly |
| Freelancer spams many applications | Freelancer commits to **one** negotiation before unlocking |

**Core promise:** Scarcity + commitment. Every job is an exclusive window — take it or free it.

---

## 2. Roles & Capabilities

```
CLIENT                          FREELANCER
  │                                │
  ├─ Post job                      ├─ Browse feed of Job Cards
  ├─ Set budget                    ├─ Click to lock a job
  ├─ Write Agreement Text          ├─ 1-on-1 realtime chat
  ├─ Negotiate 1-on-1              ├─ ACCEPT or DECLINE
  └─ Wait for lock                 └─ SIGN agreement to close
```

| Feature | Client | Freelancer |
|---|---:|---|
| Create job with Agreement Text | ✓ | ✗ |
| View all available jobs | ✗ | ✓ |
| Lock a job | ✗ | ✓ (one at a time) |
| Realtime chat | ✓ | ✓ |
| Accept / Decline | ✗ | ✓ (in room) |
| Sign agreement | ✗ | ✓ (modal) |
| Release job manually | ✗ | Decline → job returns to feed |

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14** (App Router) + **React 18** + **Tailwind CSS** | SSR, file-based routing, clean utility styling |
| State | **Zustand** | Lightweight global lock (`isNegotiating`, `activeJobId`) |
| Database | **Supabase** (PostgreSQL + Realtime + Auth + RPC) | All-in-one: DB, realtime, auth, serverless functions |
| Realtime | **Supabase Realtime** (built-in WebSockets) | No extra server needed; live chat, job updates, TTL |
| Auth | **Supabase Auth** (email + Google OAuth) | Managed auth with RLS integration |
| Locking | **PostgreSQL RPCs** (security definer) | `lock_job()`, `decline_negotiation()`, `accept_negotiation()` |
| TTL | **pg_cron** (every minute) | `release_expired_locks()` frees 15-min abandoned negotiations |

> **Architecture note:** The Express + Socket.IO backend (`backend/` folder) was the original reference implementation but is **no longer deployed**. All realtime and locking logic now runs inside Supabase (RPCs + pg_cron). The `backend/` folder is kept in the repo for reference only.

---

## 4. Key Features

- **Global job feed** — realtime status (`OPEN` / `OCCUPIED` / `CLOSED`)
- **Occupied overlay** — greyed card + lock icon for jobs held by someone else
- **Global Status Bar** — `Status: 1 Project in Negotiation Stage` when locked
- **UI hardening** — freelancer cannot open any other card while negotiating
- **Realtime chat room** — two participants, message history, presence indicators
- **Accept → Agreement modal** — must scroll/read + `SIGN & CONFIRM` to close
- **Decline → instant release** — job returns to feed for everyone
- **15-minute auto-release** — cron/TTL sweep frees abandoned negotiations
- **Concurrency-safe lock** — DB-level transaction; only one winner per millisecond

---

## 5. Quick Start

### Option A: Mock Mode (no backend required)
```bash
cd frontend && npm install
npm run dev                   # → http://localhost:3000
# USE_MOCK = true in lib/api.ts (default)
# Demo accounts work out of the box
```

### Option B: Supabase (production)
```bash
# 1. Create Supabase project at supabase.com
# 2. SQL Editor: run supabase/schema.sql → then supabase/schema_v2.sql → then supabase/seed.sql
# 3. Copy Project URL + anon key → add to Vercel env vars:
#    NEXT_PUBLIC_SUPABASE_URL=...
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# 4. Set USE_MOCK = false in lib/api.ts (or NEXT_PUBLIC_USE_MOCK=0)
# 5. Deploy to Vercel (push to main)
```

Full instructions → [`SETUP.md`](SETUP.md)

---

## 6. Demo Accounts

| Email | Password | Role |
|---|---:|---|
| `client@demo.dev` | `password123` | Client |
| `freelancer@demo.dev` | `password123` | Freelancer |
| `jordan@demo.dev` | `password123` | Freelancer |

---

## 7. Docs Index

| File | Covers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Folder layout, component map, data flow |
| [`WORKFLOW.md`](WORKFLOW.md) | User journeys, state machine, wireframes (text) |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | Prisma schema, indexes, constraints |
| [`API_SPEC.md`](API_SPEC.md) | REST endpoints + Socket.IO events |
| [`EDGE_CASES.md`](EDGE_CASES.md) | Race conditions, timeouts, failure modes |
| [`SETUP.md`](SETUP.md) | Install, env vars, seed, run, scripts |

---

## 8. License

MIT — free to fork and adapt.
