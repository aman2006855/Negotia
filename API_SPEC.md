# API Specification

> Every REST endpoint and Socket.IO event. Base URL, auth, payloads, responses, and error codes.

---

## 1. Conventions

| Item | Value |
|---|---|
| Base URL (dev) | `http://localhost:4000` |
| Frontend env | `NEXT_PUBLIC_API_URL` |
| Auth (REST) | `Authorization: Bearer <JWT>` |
| Auth (Socket.IO) | `socket.handshake.auth.token` |
| Content-Type | `application/json` |
| Money | `budgetCents: number` — integer cents (`180000` = $1,800.00) |
| Timestamps | ISO 8601 strings (`2026-09-04T12:00:00.000Z`) |
| IDs | `cuid()` strings |

All bodies and socket payloads are validated with **Zod**. Invalid payloads return `400 BAD_REQUEST`.

Error shape (REST):

```json
{ "error": "Human readable message", "details": { "...zod flatten..." } }
```

Error shape (Socket ack):

```json
{ "ok": false, "error": "JOB_TAKEN" }
```

Success shape (Socket ack):

```json
{ "ok": true, "negotiation": { "..." }, "job": { "..." } }
```

### Error Codes

| Code | Meaning |
|---|---|
| `JOB_TAKEN` | Job already OCCUPIED by someone else |
| `NOT_FOUND` | Job / negotiation not found |
| `NOT_OPEN` | Job is CLOSED |
| `ALREADY_NEGOTIATING` | Freelancer already holds a lock |
| `NOT_PARTICIPANT` | Not a member of this negotiation |
| `ALREADY_CLOSED` | Negotiation already has an outcome |
| `STALE` | Lock was released while acting |
| `BAD_REQUEST` | Zod validation failed |
| `UNAUTHORIZED` | Missing / invalid JWT or wrong role |
| `INTERNAL` | Unexpected server error |

---

## 2. REST Endpoints

### 2.1 `GET /api/health`

No auth.

```
→ 200 { "ok": true, "ts": 1714800000000 }
```

### 2.2 `POST /api/auth/login`

No auth. Body:

```json
{ "email": "freelancer@demo.dev", "password": "password123" }
```

Validation: `email` must be valid email, `password` 6–100 chars.

Responses:

```
200  { "token": "<JWT>", "user": { "id": "...", "name": "Sam", "email": "...", "role": "FREELANCER" } }
401  { "error": "Invalid email or password" }
400  { "error": "Invalid credentials format" }
```

The returned `token` is stored as `localStorage.negotia_token` and sent on every subsequent call.

### 2.3 `GET /api/auth/me`

Auth required.

```
→ 200 {
      "user": { "id": "...", "name": "Sam", "email": "...", "role": "FREELANCER" },
      "activeJob": { "jobId": "...", "negotiationId": "..." } | null
    }
```

- `activeJob` is non-null only for freelancers with `isNegotiating=true`.
- If the DB says `isNegotiating=true` but no live negotiation exists (stale lock), the server heals it: `isNegotiating=false` and returns `null`.
- Frontend hydrates Zustand from this on every page load.

### 2.4 `GET /api/jobs`

Auth required. Any role.

```
→ 200 { "jobs": [ FeedJob, ... ] }
```

`FeedJob`:

```ts
{
  id: string;
  title: string;
  description: string;
  budgetCents: number;
  status: "OPEN" | "OCCUPIED" | "CLOSED";  // CLOSED excluded from feed
  lockedAt: string | null;
  createdAt: string;
}
```

- Only `OPEN` and `OCCUPIED` jobs are returned, newest first.
- **Deliberately excludes** `lockedByFreelancerId` — other freelancers never learn who holds the lock.

### 2.5 `POST /api/jobs`

Auth required. **CLIENT only** (`requireRole("CLIENT")`).

Body:

```json
{
  "title": "Design a mobile onboarding flow",
  "description": "4–5 screens, Figma handoff, ...",
  "budgetCents": 180000,
  "agreementText": "Payment on delivery. 2 revisions. NDA required. Timeline: 14 days..."
}
```

| Field | Constraint |
|---|---|
| `title` | 4–120 chars |
| `description` | 10–4000 chars |
| `budgetCents` | int, 100–50_000_000 |
| `agreementText` | 20–12,000 chars, **mandatory** — snapshotted on sign |

Responses:

```
201  { "job": FeedJob }
400  { "error": "Invalid job payload", "details": { ... } }
403  { "error": "Must be a CLIENT" }
```

### 2.6 `GET /api/jobs/mine`

Auth required. **CLIENT only.**

Returns the client's own jobs with lock-holder identity (unlike the public feed):

```
→ 200 {
      "jobs": [
        {
          id, title, description, budgetCents, status, lockedAt, createdAt,
          lockedByFreelancer: { id, name } | null,
          negotiations: [{ id }]   // live negotiations only (outcome = null)
        },
        ...
      ]
    }
```

Used by the client dashboard to show "Negotiating with Sam — Open chat".

---

## 3. Socket.IO Events

Connect with:

```ts
import { io } from "socket.io-client";
const socket = io(API_URL, { auth: { token }, transports: ["websocket", "polling"] });
```

Server verifies `token` on `connection`. Invalid token → immediate disconnect.

### 3.1 Rooms (server-managed)

| Room | Who joins | How |
|---|---|---|
| `user:<id>` | Every connected user | On `connection` |
| `feed:freelancers` | Every freelancer | On `connection` if `role === "FREELANCER"` |
| `negotiation:<id>` | 2 participants | On `job:lock` success or `negotiation:join` |

Clients never join rooms manually — the server does it.

---

### 3.2 Client → Server

#### `job:lock`

The critical click. **Freelancer only.**

```ts
socket.timeout(5000).emitWithAck("job:lock", { jobId: "cj..." })
```

Ack:

```ts
// win
{ ok: true, negotiation: { id, jobId, clientId, freelancerId, createdAt }, job: { id, status: "OCCUPIED", ... } }

// lose — someone else won the race
{ ok: false, error: "JOB_TAKEN" }

// already in a negotiation
{ ok: false, error: "ALREADY_NEGOTIATING" }

// wrong role / bad payload / not found
{ ok: false, error: "UNAUTHORIZED" | "BAD_REQUEST" | "NOT_FOUND" | "NOT_OPEN" }
```

Side effects on `ok: true`:
1. Server joins socket to `negotiation:<id>`.
2. Emits `negotiation:started` to `user:<clientId>`.
3. Broadcasts `job:updated` to `feed:freelancers`.

Idempotent re-entry: if the freelancer already holds this job, returns the existing live negotiation instead of failing.

#### `negotiation:join`

Join (or rejoin) a negotiation room and fetch its full state.

```ts
socket.timeout(8000).emitWithAck("negotiation:join", { negotiationId: "cj..." })
```

Ack:

```ts
{
  ok: true,
  state: {
    negotiationId: string;
    myRole: "CLIENT" | "FREELANCER";
    outcome: null | "ACCEPTED" | "DECLINED" | "EXPIRED";
    closedAt: string | null;
    job: { id, title, description, budgetCents, agreementText, clientName },
    messages: [{ id, senderId, senderName, body, createdAt }, ...] // up to 200, ASC
  }
}

{ ok: false, error: "NOT_FOUND" | "NOT_PARTICIPANT" | "BAD_REQUEST" }
```

Also clears `abandonedAt` if the freelancer is reconnecting.

#### `negotiation:message`

Send a chat message. Either participant.

```ts
socket.emitWithAck("negotiation:message", { negotiationId: "cj...", body: "Hello, can we adjust the timeline?" })
```

Validation: `body` 1–2000 chars (trimmed).

Ack:

```ts
{ ok: true, message: { id, senderId, senderName, body, createdAt } }
{ ok: false, error: "ALREADY_CLOSED" | "NOT_PARTICIPANT" | "BAD_REQUEST" }
```

Broadcast: `negotiation:message` to the other participant in `negotiation:<id>`. Also bumps `lastActivityAt` (resets the 15-min TTL).

#### `negotiation:decline`

Freelancer declines. Must be the assigned freelancer.

```ts
socket.emitWithAck("negotiation:decline", { negotiationId: "cj..." })
```

```
{ ok: true }
{ ok: false, error: "NOT_PARTICIPANT" | "ALREADY_CLOSED" | "BAD_REQUEST" }
```

Side effects: `finalizeNegotiation(DECLINED)` → job `OCCUPIED → OPEN`, broadcasts `negotiation:closed` + `job:updated` + `lock:released`.

#### `agreement:sign`

Freelancer signs the agreement. Must be the assigned freelancer.

```ts
socket.emitWithAck("agreement:sign", { negotiationId: "cj..." })
```

```
{ ok: true }
{ ok: false, error: "NOT_PARTICIPANT" | "ALREADY_CLOSED" | "STALE" | "BAD_REQUEST" }
```

Side effects: `finalizeNegotiation(ACCEPTED)` → job `OCCUPIED → CLOSED`, creates `SignedAgreement` snapshot, broadcasts `negotiation:closed` + `job:updated` + `lock:released`.

#### `presence:heartbeat`

Freelancer heartbeat. No payload.

```ts
socket.emit("presence:heartbeat")
```

No ack. Server does `touchNegotiation(freelancerId)` → `lastActivityAt = now()`. Frontend sends every 60s while in the chat room.

---

### 3.3 Server → Client

#### `job:updated`

Broadcast to `feed:freelancers` on every status flip.

```ts
socket.on("job:updated", (job: FeedJob) => upsertJob(job))
// job.status is "OCCUPIED" (locked), "OPEN" (released), or "CLOSED" (signed)
```

#### `negotiation:started`

Direct to `user:<clientId>` when their job is locked.

```ts
socket.on("negotiation:started", (state: NegotiationState) => { /* navigate to /negotiate/:id */ })
```

#### `negotiation:message`

To the other participant in `negotiation:<id>`.

```ts
socket.on("negotiation:message", (msg: { id, senderId, senderName, body, createdAt }) => appendMessage(msg))
```

#### `negotiation:closed`

To both participants in `negotiation:<id>` when it ends (any outcome).

```ts
socket.on("negotiation:closed", ({ negotiationId, outcome }: { negotiationId: string; outcome: NegotiationOutcome }) => { /* show banner */ })
```

#### `lock:released`

Direct to `user:<freelancerId>` when their global lock is cleared.

```ts
socket.on("lock:released", ({ negotiationId, reason }: { negotiationId: string; reason: "declined" | "signed" | "expired" }) => {
  releaseLock(); // Zustand: myActiveJobId = null
})
```

#### `negotiation:state`

Sent on reconnect — the server pushes the current negotiation state to a rejoining freelancer.

```ts
socket.on("negotiation:state", (state: NegotiationState) => setState(state))
```

---

## 4. Sequence — Happy Path (Freelancer Accepts)

```
Client                          Server                          Freelancer
  │                               │                                  │
  │  POST /api/jobs               │                                  │
  │──────────────────────────────►│                                  │
  │  201 { job: OPEN }            │   GET /api/jobs                  │
  │                               │◄─────────────────────────────────│
  │                               │   200 { jobs: [OPEN, ...] }      │
  │                               │─────────────────────────────────►│
  │                               │                                  │  click card
  │                               │   job:lock { jobId }             │
  │                               │◄─────────────────────────────────│
  │  negotiation:started          │   ── CAS-1 + CAS-2 ──► WIN       │
  │◄──────────────────────────────│   join negotiation:<id>          │
  │  → /negotiate/:id             │   job:updated → feed             │
  │                               │─────────────────────────────────►│  ack { ok: true }
  │  negotiation:join             │                                  │  → /negotiate/:id
  │──────────────────────────────►│                                  │
  │  ack { state, messages:[] }   │   negotiation:join               │
  │◄──────────────────────────────│◄─────────────────────────────────│
  │                               │   ack { state, messages:[] }     │
  │                               │─────────────────────────────────►│
  │  negotiation:message          │                                  │  negotiation:message
  │◄──────────────────────────────│◄─────────────────────────────────│
  │  "What's the timeline?"       │                                  │  "14 days, 2 revisions"
  │──────────────────────────────►│─────────────────────────────────►│
  │                               │                                  │  [ACCEPT] → modal
  │                               │   agreement:sign                 │
  │  negotiation:closed           │◄─────────────────────────────────│
  │  outcome=ACCEPTED             │   finalizeNegotiation(ACCEPTED)  │
  │◄──────────────────────────────│   job: CLOSED                    │
  │                               │   lock:released                  │
  │  job:updated CLOSED           │─────────────────────────────────►│  negotiation:closed
  │◄──────────────────────────────│                                  │  lock:released
```

---

## 5. cURL Examples

```bash
API=http://localhost:4000

# Login as freelancer
TOKEN=$(curl -s $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer@demo.dev","password":"password123"}' | jq -r .token)

# Fetch feed
curl -s $API/api/jobs -H "Authorization: Bearer $TOKEN" | jq .

# Login as client and post a job
CTOKEN=$(curl -s $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@demo.dev","password":"password123"}' | jq -r .token)

curl -s $API/api/jobs -X POST \
  -H "Authorization: Bearer $CTOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a landing page",
    "description": "Single page, responsive, with contact form and analytics.",
    "budgetCents": 90000,
    "agreementText": "Delivery in 10 days. One revision. Payment via escrow on approval."
  }' | jq .
```
