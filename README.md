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
| Backend | **Node.js** + **Express** | Lightweight API + WebSocket server |
| Realtime | **Socket.IO** (WebSockets) | Bidirectional events, rooms, auto-reconnect |
| Database | **PostgreSQL** + **Prisma ORM** | ACID transactions for race-free locking |
| Auth | **JWT** (Bearer / `auth.token`) | Stateless, works for REST + Socket.IO |

**Alternative backends:** Supabase (Postgres + Realtime) can partially replace Express + Socket.IO. Firebase uses Firestore (different paradigm). Both require schema adaptation.

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

```bash
# Backend
cd backend && npm install
cp .env.example .env          # set DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev                   # → http://localhost:4000

# Frontend
cd frontend && npm install
cp .env.example .env          # set NEXT_PUBLIC_API_URL
npm run dev                   # → http://localhost:3000
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
