# Workflow & Logic

> Every user journey, state transition, and realtime sequence in the 1-on-1 Negotiation board.

---

## 1. Roles at a Glance

```
CLIENT                          FREELANCER
──────                          ──────────
Creates jobs                    Browses feed
Sets Agreement Text             Locks ONE job at a time
Waits for lock event            Negotiates in private chat
Responds in chat                ACCEPT → sign  |  DECLINE → release
                                Cannot touch other jobs while locked
```

One invariant governs the entire system:

> **A freelancer can hold at most ONE active negotiation. A job can be held by at most ONE freelancer.**

Everything else is derived from this.

---

## 2. Client Workflow

```
Step 1 — Post a Job
  │
  ├─ Title (4–120 chars)
  ├─ Description (10–4000 chars)
  ├─ Budget (cents, e.g. 180000 = $1,800.00)
  └─ Agreement Text ★ mandatory (20–12,000 chars)
        "Payment on delivery. 2 revisions. NDA required …"
        This exact text is snapshotted when the freelancer signs.

  POST /api/jobs → status = OPEN → appears on every freelancer's feed

Step 2 — Wait
  │
  ├─ Job card shows "OPEN" to all freelancers
  └─ Client sees it in "My Jobs" as "Waiting for freelancer…"

Step 3 — Lock Event (realtime)
  │
  ├─ A freelancer clicks the card → job flips to OCCUPIED
  ├─ Client receives socket event  negotiation:started
  ├─ Client is auto-navigated to /negotiate/:id
  └─ My Jobs card updates → "Negotiating with Sam…"

Step 4 — Negotiate
  │
  ├─ Realtime chat (both sides)
  ├─ Client answers questions, clarifies scope
  └─ Waits for freelancer to ACCEPT or DECLINE

Step 5 — Resolution
  │
  ├─ DECLINED  → job returns to OPEN, client sees "Available again"
  ├─ ACCEPTED  → job becomes CLOSED, agreement is signed & stored
  └─ EXPIRED   → 15-min timeout, same as declined
```

---

## 3. Freelancer Workflow — The Board

```
Feed (GET /api/jobs + socket job:updated)
  │
  ├─ Card shows: title, truncated description, budget, status chip
  │
  ├─ OPEN  + not locked elsewhere  →  white card, hover shadow, clickable
  ├─ OCCUPIED (by someone else)    →  dark overlay + lock icon, not clickable
  ├─ OCCUPIED (by me)              →  emerald ring + "Resume →", clickable
  ├─ CLOSED                        →  dimmed + "Filled"
  └─ OPEN + I already hold a lock  →  dimmed + "Finish your current negotiation"

Click OPEN card
  │
  ├─ Frontend checks Zustand: myActiveJobId === null ?
  │     No  → block click, show toast "Finish your current negotiation"
  │     Yes → emit  job:lock { jobId }
  │
  ├─ Server transaction (CAS-1 + CAS-2) — see §6
  │     ├─ WIN  → ack { ok: true, negotiation, job }
  │     │         store.acquireLock(jobId, negotiationId)
  │     │         show StatusBar: "1 Project in Negotiation Stage"
  │     │         router.push("/negotiate/:id")
  │     │         every other freelancer's card flips to OCCUPIED instantly
  │     │
  │     └─ LOSE → ack { ok: false, error: "JOB_TAKEN" }
  │               toast "Someone just took this job"
  │               patch card → OCCUPIED overlay (no reload needed)
  │
  └─ ALREADY_NEGOTIATING → toast + redirect to existing /negotiate/:id
```

### 3.1 The Global Lock — How the UI Is "Physically Blocked"

```ts
// lib/store.ts
myActiveJobId: string | null   // null = free to browse, string = locked

// JobCard.tsx — every card reads this
const isMyJob = job.status === "OCCUPIED" && job.id === myActiveJobId;
const blockedByMyOtherNegotiation = !!myActiveJobId && myActiveJobId !== job.id;

// State rendering logic:
// - OPEN + not blocked        → clickable (white card)
// - OPEN + blocked            → dimmed ("Finish your current negotiation")
// - OCCUPIED + isMyJob        → clickable (emerald ring, "Resume →")
// - OCCUPIED + !isMyJob       → dark overlay + lock icon
// - CLOSED                    → dimmed ("Filled")
const clickable = (job.status === "OPEN" && !blockedByMyOtherNegotiation) || isMyJob;
```

- No prop drilling, no page reload. Zustand is the gate.
- Hydrated on every load from `GET /api/auth/me → activeJob`.
- Cleared only by `lock:released` (decline / accept / timeout) — server is the authority.

---

## 4. Negotiation Room Workflow

```
Enter: /negotiate/:id
  │
  ├─ socket.emit("negotiation:join", { negotiationId }) → ack with state
  │     state = { job, messages[], myRole, outcome }
  │
  ├─ Join socket room  negotiation:<id>
  ├─ Start heartbeat:  presence:heartbeat every 60s (refreshes lastActivityAt)
  └─ Render: header (job title + budget) + message list + input

Chat Loop
  │
  ├─ Type + Send → socket.emit("negotiation:message", { negotiationId, body })
  │     → server creates Message + bumps lastActivityAt
  │     → broadcasts to the other participant in the same room
  │
  └─ Receive → socket.on("negotiation:message") → append to list

Freelancer sees two extra buttons (client does not):

  ┌─────────────────────────────────────────┐
  │  [  DECLINE  ]        [  ACCEPT  ]      │
  └─────────────────────────────────────────┘

  DECLINE ──► confirm dialog ──► socket.emit("negotiation:decline")
                │                           │
                │  server: finalizeNegotiation(DECLINED)
                │    job: OCCUPIED → OPEN
                │    negotiation: outcome = DECLINED
                │    user: isNegotiating = false
                │                           │
                ├─► negotiation:closed → both see "Negotiation declined"
                ├─► job:updated → feed card returns to OPEN for everyone
                └─► lock:released → freelancer's StatusBar disappears, can browse again

  ACCEPT  ──► opens AgreementModal
                │
                ├─ Scrollable box shows agreementText (exact client text)
                ├─ Checkbox: "I have read and agree to these terms"
                └─ [ SIGN & CONFIRM ] ──► socket.emit("agreement:sign")
                        │
                        │  server: finalizeNegotiation(ACCEPTED)
                        │    job: OCCUPIED → CLOSED
                        │    negotiation: outcome = ACCEPTED
                        │    signed_agreements: snapshot of agreementText
                        │    user: isNegotiating = false
                        │
                        ├─► negotiation:closed (ACCEPTED) → both see "Agreement signed ✓"
                        ├─► job:updated (CLOSED) → card becomes "Filled" everywhere
                        └─► lock:released → freelancer freed (job is done, not returned to feed)
```

---

## 5. State Machines

### 5.1 Job Status

```
          job:lock (win)              agreement:sign
  OPEN ─────────────────► OCCUPIED ─────────────────► CLOSED
   ▲                       │                            (terminal)
   │                       │
   │  decline / timeout    │  re-entry (same freelancer): no status change,
   └───────────────────────┘  returns existing live negotiation
```

- `OPEN → OCCUPIED` — only via the lock transaction (CAS-1).
- `OCCUPIED → OPEN` — decline or 15-min TTL expiry.
- `OCCUPIED → CLOSED` — sign.
- `CLOSED` is terminal — never transitions again.

### 5.2 User Lock (Freelancer)

```
  isNegotiating = false, activeJobId = null
          │  job:lock (win)
          ▼
  isNegotiating = true, activeJobId = "<jobId>"
          │  decline / sign / timeout
          ▼
  isNegotiating = false, activeJobId = null
```

### 5.3 Negotiation Outcome

```
  outcome = null  (live)
       │
       ├─► DECLINED   (freelancer clicked Decline)
       ├─► ACCEPTED   (freelancer signed)
       └─► EXPIRED    (sweeper: inactive 15 min OR disconnected 60s)
```

---

## 6. Locking Sequence — The Critical Millisecond

Two freelancers click the same OPEN job at `t = 0ms`.

```
Freelancer A                         Postgres                      Freelancer B
     │                                  │                              │
     ├── UPDATE jobs                    │                              │
     │   SET status='OCCUPIED'          │                              │
     │   WHERE id=:id AND status='OPEN' │                              │
     │─────────────────────────────────►│◄─────────────────────────────┤
     │   (row lock acquired)            │   (waits for row lock)       │
     │◄─────────────────────────────────┤                              │
     │   count = 1  (WIN)               │                              │
     │                                  │   (re-evaluates WHERE)       │
     │                                  │   status is now OCCUPIED     │
     │                                  │─────────────────────────────►│
     │                                  │   count = 0  (LOSE)         │
     │                                  │                              │
     ├── UPDATE users                   │                              ├── ack { ok:false, error:"JOB_TAKEN" }
     │   SET isNegotiating=true         │                              │   patch card → OCCUPIED overlay
     │   WHERE id=:A AND isNegotiating=false                            │
     │─────────────────────────────────►│                              │
     │   count = 1                      │                              │
     │                                  │                              │
     ├── INSERT negotiations             │                              │
     │─────────────────────────────────►│                              │
     │   COMMIT                         │                              │
     │                                  │                              │
     ├── ack { ok:true }                │                              │
     ├── join negotiation:<id>           │                              │
     └── broadcast job:updated           │                              │
         to feed:freelancers            │                              │
```

Key guarantee: **Postgres evaluates `WHERE status='OPEN'` atomically under the row lock.** The second transaction re-checks after waiting — it sees `OCCUPIED` and affects 0 rows. No application-level mutex, no Redis — just SQL.

Full code and sweep logic → `EDGE_CASES.md` and `DATABASE_SCHEMA.md`.
