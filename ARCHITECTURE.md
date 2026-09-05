# Architecture

> How the Freelance Job Board is structured, how data moves, and where each piece lives.

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS FRONTEND                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Board   │  │  Status  │  │ Negotiation│  │  Zustand      │  │
│  │  (Feed)  │  │   Bar    │  │ Chat Room  │  │  Store        │  │
│  └────┬─────┘  └────┬─────┘  └──────┬─────┘  └───────┬───────┘  │
│       │             │               │                │           │
│       └─────────────┴───────┬───────┴────────────────┘           │
│                             │  Socket.IO Client                  │
└─────────────────────────────┼────────────────────────────────────┘
                              │  ws  +  REST (fetch)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND (Express)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  REST Routes │  │  Socket.IO   │  │  Services            │   │
│  │  /api/auth   │  │  Handlers    │  │  • negotiation.ts    │   │
│  │  /api/jobs   │  │  rooms       │  │  • state.ts          │   │
│  └──────┬───────┘  └──────┬───────┘  │  • sweep.ts (TTL)    │   │
│         │                 │          └──────────┬───────────┘   │
│         └─────────────────┴─────────────────────┘               │
│                              │  Prisma Client                   │
└──────────────────────────────┼──────────────────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   PostgreSQL        │
                    │  users / jobs /     │
                    │  negotiations /     │
                    │  messages /         │
                    │  signed_agreements  │
                    └─────────────────────┘
```

**Two channels, one truth:**
- **REST** — initial load, job creation, auth. Stateless, cacheable.
- **WebSocket (Socket.IO)** — every mutation that must be seen instantly (lock, release, chat). Server is the single source of truth; clients are mirrors.

---

## 2. Frontend Architecture — `frontend/`

### 2.1 App Router (Next.js 14)

```
frontend/
├── app/
│   ├── layout.tsx               # root layout + Inter font + globals.css
│   ├── globals.css              # Tailwind base
│   ├── page.tsx                 # "/" — board shell (role-aware)
│   ├── login/page.tsx           # email/password + demo quick-fill
│   ├── post/page.tsx            # client: create job form
│   └── negotiate/[id]/page.tsx  # chat room (freelancer + client)
├── components/
│   ├── Header.tsx               # app name, role badge, logout, "Post Job"
│   ├── JobFeed.tsx              # grid of JobCard, empty/loading states
│   ├── JobCard.tsx              # ★ critical — 5 visual states (see §4)
│   ├── StatusBar.tsx            # sticky "1 Project in Negotiation"
│   ├── ChatRoom.tsx             # message list + input + Accept/Decline
│   ├── AgreementModal.tsx       # scrollable terms + SIGN & CONFIRM
│   └── icons.tsx                # Lock, Send, Check, X (inline SVG)
└── lib/
    ├── types.ts                 # FeedJob, NegotiationState, ChatMessage
    ├── api.ts                   # fetch wrapper (Bearer token)
    ├── socket.ts                # singleton Socket.IO client
    ├── store.ts                 # Zustand — global lock + feed
    └── useRealtime.ts           # hook: job:updated / lock:released → store
```

### 2.2 Why This Split?

| Concern | Where it lives | Why |
|---|---|---|
| **Routing** | `app/` | File-based, no custom router |
| **Styling** | Tailwind in every component | Utility-first, no CSS files to maintain |
| **Global lock** | `store.ts` (`myActiveJobId`) | One boolean gates the entire board |
| **Realtime** | `socket.ts` + `useRealtime.ts` | Single socket, many listeners |
| **API calls** | `api.ts` | Token injection in one place |

### 2.3 Data Flow (Frontend)

```
GET /api/auth/me ──► store.user + store.myActiveJobId
GET /api/jobs    ──► store.jobs
         │
         ▼
   JobFeed renders JobCard[]
         │
   click OPEN card ──► socket.emit("job:lock") ──► ack
         │                                      │
         │  ok ──► store.acquireLock()          │  fail ──► toast + refresh card
         │         router.push("/negotiate/:id")
         │
   socket.on("job:updated") ──► store.upsertJob()  (realtime feed)
   socket.on("lock:released") ──► store.releaseLock() + toast
```

---

## 3. Backend Architecture — `backend/`

```
backend/
├── prisma/
│   ├── schema.prisma            # 5 models, 3 enums
│   └── seed.ts                  # 3 demo users + 3 jobs
├── src/
│   ├── index.ts                 # Express + http.createServer + Socket.IO + sweep
│   ├── config.ts                # PORT, JWT_SECRET, TTLs
│   ├── db.ts                    # PrismaClient singleton
│   ├── errors.ts                # NegotiationError + codes
│   ├── auth.ts                  # signToken / verifyToken / hash
│   ├── middleware.ts            # requireAuth, requireRole
│   ├── validation.ts            # Zod schemas
│   ├── services/
│   │   ├── negotiation.ts       # ★ lockJob / finalizeNegotiation / messages
│   │   ├── state.ts             # buildNegotiationState (DTO)
│   │   └── sweep.ts             # startSweep — 30s interval TTL
│   ├── routes/
│   │   ├── auth.ts              # POST /login, GET /me
│   │   └── jobs.ts              # GET /, POST /, GET /mine
│   └── sockets.ts               # ★ all Socket.IO handlers + rooms
├── package.json
├── tsconfig.json
└── .env.example
```

### 3.1 Request Lifecycle

```
REST:   Client → Express → middleware (auth) → validation (Zod) → Prisma → JSON
Socket: Client → Socket.IO → verifyToken (handshake) → validation → service → Prisma
                                        │                              │
                                        └────► broadcast to rooms ──────┘
```

### 3.2 Socket.IO Rooms

| Room | Members | Purpose |
|---|---|---|
| `user:<id>` | One user (all their tabs) | Direct pushes: `negotiation:started`, `lock:released` |
| `feed:freelancers` | Every freelancer | Broadcast: `job:updated` (status flip) |
| `negotiation:<id>` | 2 participants | Chat: `negotiation:message`, `negotiation:closed` |

---

## 4. Job Card — The Five States

`components/JobCard.tsx` renders one of these based on two inputs: `job.status` and `store.myActiveJobId`.

```
job.status === "OPEN"  &&  myActiveJobId === null       → ① Available (clickable, hover shadow)
job.status === "OPEN"  &&  myActiveJobId !== null       → ⑤ Blocked ("Finish your current negotiation")
job.status === "OCCUPIED" && job.id === myActiveJobId   → ③ My negotiation (emerald ring, "Resume →")
job.status === "OCCUPIED" && job.id !== myActiveJobId   → ② Occupied (dark overlay + lock icon)
job.status === "CLOSED"                                 → ④ Filled (dimmed, "Assigned")
```

No prop drilling — the card reads `myActiveJobId` directly from Zustand.

---

## 5. State Management — Zustand Store

```ts
// lib/store.ts  (simplified)
interface BoardState {
  user: Me["user"] | null;
  jobs: FeedJob[];
  myActiveJobId: string | null;      // ← the global lock
  myNegotiationId: string | null;
  toast: string | null;

  setUser, setJobs, upsertJob, patchJob,
  acquireLock(jobId, negotiationId),  // set on lock success
  releaseLock(),                      // clear on decline/accept/timeout
}
```

- **Source of truth:** `users.is_negotiating` + `active_job_id` in Postgres.
- **Mirror:** Zustand hydration from `GET /api/auth/me` on every page load.
- **Sync:** `job:updated` and `lock:released` socket events keep the mirror fresh without polling.

---

## 6. Security

| Concern | Mitigation |
|---|---|
| Auth | JWT in `Authorization: Bearer` (REST) and `socket.handshake.auth.token` (WS). `verifyToken` on every event. |
| Role enforcement | `requireRole("CLIENT")` on `POST /api/jobs`; socket checks `user.role === "FREELANCER"` before `job:lock`. |
| Participant check | `buildNegotiationState` + `sendNegotiationMessage` verify `freelancerId === user.id OR clientId === user.id`. |
| Input validation | Zod on every REST body and every socket payload. |
| No lock leakage | Feed DTO excludes `lockedByFreelancerId`; occupied cards show "Occupied" not "Occupied by Sam". |

---

## 7. Scalability Notes

- **Horizontal WS scaling:** Socket.IO with Redis adapter (`@socket.io/redis-adapter`) — `job:updated` fans out across instances.
- **DB load:** `status` and `(outcome, lastActivityAt)` indexes cover every hot query. Lock transaction is ~3 statements, <10ms.
- **Sweeper:** Single leader (or DB advisory lock) if running multiple API replicas.
- **Rate limiting:** Add `express-rate-limit` on `job:lock` (e.g., 10/min per freelancer) to prevent spam.
