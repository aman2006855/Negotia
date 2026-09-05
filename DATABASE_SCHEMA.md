# Database Schema

> Prisma + PostgreSQL — every table, relation, index, and the invariant that makes the lock race-free.

---

## 1. Entity-Relationship Overview

```
User ──1──┐
          ├──< Job ──1──< Negotiation ──1──< Message
          │         │              │
          │         │              └──1── SignedAgreement
          │         │
          └──< Negotiation (as client / as freelancer)
          └──< Message (sender)
          └──< SignedAgreement (signer)
```

- A **User** is either `CLIENT` or `FREELANCER` (single role, no switching).
- A **Job** belongs to one client, may be locked by one freelancer at a time.
- A **Negotiation** ties one job + one client + one freelancer. `outcome = null` means live.
- A **Message** belongs to one negotiation.
- A **SignedAgreement** is the immutable snapshot created on `ACCEPTED`.

---

## 2. Enums

```prisma
enum Role {
  CLIENT
  FREELANCER
}

enum JobStatus {
  OPEN        // on the feed, anyone can try to lock
  OCCUPIED    // held by one freelancer, hidden from others
  CLOSED      // signed — terminal, never reopens
}

enum NegotiationOutcome {
  ACCEPTED    // freelancer signed the agreement
  DECLINED    // freelancer clicked Decline
  EXPIRED     // sweeper released it (timeout / disconnect)
}
```

---

## 3. Prisma Models

### 3.1 User

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  passwordHash  String
  role          Role     @default(FREELANCER)

  // ── Global freelancer lock ─────────────────────────────
  // Enforces "one negotiation at a time" at the DB level.
  // Both fields are updated atomically inside lockJob().
  isNegotiating Boolean  @default(false)
  activeJobId   String?
  activeJob     Job?     @relation("ActiveNegotiation", fields: [activeJobId], references: [id], onDelete: SetNull)

  // ── Relations ──────────────────────────────────────────
  jobsPosted               Job[]           @relation("JobPoster")
  negotiationsAsFreelancer Negotiation[]   @relation("FreelancerSide")
  negotiationsAsClient     Negotiation[]   @relation("ClientSide")
  messagesSent             Message[]
  agreementsSigned         SignedAgreement[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

| Field | Notes |
|---|---|
| `isNegotiating` | `true` while inside a live negotiation. Checked by `CAS-2` in `lockJob()`. |
| `activeJobId` | FK to the locked job. `null` when free. Used to hydrate Zustand on page load. |

### 3.2 Job

```prisma
model Job {
  id            String    @id @default(cuid())
  clientId      String
  client        User      @relation("JobPoster", fields: [clientId], references: [id], onDelete: Cascade)
  title         String
  description   String
  budgetCents   Int       // integer cents — no floating point money
  agreementText String    // mandatory terms, snapshotted on sign

  status JobStatus @default(OPEN)

  // ── Current lock holder (null when OPEN or CLOSED) ────
  lockedByFreelancerId String?
  lockedByFreelancer   User?   @relation("ActiveNegotiation", fields: [lockedByFreelancerId], references: [id], onDelete: SetNull)
  lockedAt             DateTime?
  closedAt             DateTime?

  negotiations Negotiation[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([status, createdAt])  // feed: OPEN/OCCUPIED + newest first
  @@index([lockedByFreelancerId])
  @@map("jobs")
}
```

| Transition | How |
|---|---|
| `OPEN → OCCUPIED` | `UPDATE … WHERE status='OPEN'` — the CAS-1 in `lockJob()` |
| `OCCUPIED → OPEN` | `finalizeNegotiation(DECLINED / EXPIRED)` |
| `OCCUPIED → CLOSED` | `finalizeNegotiation(ACCEPTED)` |

Feed queries exclude `lockedByFreelancerId` — other freelancers only see `"Occupied"`, never who holds it.

### 3.3 Negotiation

```prisma
model Negotiation {
  id             String               @id @default(cuid())
  jobId          String
  job            Job                  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  clientId       String
  client         User                 @relation("ClientSide", fields: [clientId], references: [id])
  freelancerId   String
  freelancer     User                 @relation("FreelancerSide", fields: [freelancerId], references: [id])

  outcome        NegotiationOutcome?  // null = live

  createdAt      DateTime  @default(now())
  lastActivityAt DateTime  @default(now())  // bumped on message + heartbeat
  abandonedAt    DateTime?                  // set on socket disconnect
  closedAt       DateTime?

  messages        Message[]
  signedAgreement SignedAgreement?

  @@index([jobId, outcome])
  @@index([freelancerId, outcome])
  @@index([outcome, lastActivityAt])
  @@map("negotiations")
}
```

| Field | Purpose |
|---|---|
| `outcome` | `null` = room is live. Non-null = terminal. Idempotency guard in `finalizeNegotiation()`. |
| `lastActivityAt` | Sweeper releases when `lastActivityAt < now - 15min`. |
| `abandonedAt` | Sweeper releases when `abandonedAt < now - 60s` (tab close grace). Cleared on reconnect. |

### 3.4 Message

```prisma
model Message {
  id            String      @id @default(cuid())
  negotiationId String
  negotiation   Negotiation @relation(fields: [negotiationId], references: [id], onDelete: Cascade)
  senderId      String
  sender        User        @relation(fields: [senderId], references: [id])
  body          String
  createdAt     DateTime    @default(now())

  @@index([negotiationId, createdAt])
  @@map("messages")
}
```

Ordered by `createdAt ASC`, capped at 200 per `buildNegotiationState()`.

### 3.5 SignedAgreement

```prisma
model SignedAgreement {
  id            String      @id @default(cuid())
  negotiationId String      @unique
  negotiation   Negotiation @relation(fields: [negotiationId], references: [id], onDelete: Cascade)
  agreementText String      // snapshot at sign time — immutable audit trail
  signedById    String
  signedBy      User        @relation(fields: [signedById], references: [id])
  signedAt      DateTime    @default(now())

  @@map("signed_agreements")
}
```

`negotiationId @unique` — at most one signature per negotiation. Created only on `ACCEPTED`.

---

## 4. Indexes — Why Each Exists

| Index | Query it serves |
|---|---|
| `jobs(status)` | `GET /api/jobs` — `WHERE status IN ('OPEN','OCCUPIED')` |
| `jobs(lockedByFreelancerId)` | "Which job does this freelancer hold?" |
| `negotiations(jobId, outcome)` | "Is there a live negotiation for this job?" |
| `negotiations(freelancerId, outcome)` | Sweeper + `touchNegotiation` |
| `negotiations(outcome, lastActivityAt)` | Sweeper: `WHERE outcome IS NULL AND lastActivityAt < cutoff` |
| `messages(negotiationId, createdAt)` | Chat history — range scan in order |

---

## 5. Constraints & Invariants

| Invariant | Enforced by |
|---|---|
| A job has at most one live negotiation | `CAS-1`: `WHERE status='OPEN'` — only one row wins |
| A freelancer holds at most one job | `CAS-2`: `WHERE isNegotiating=false AND activeJobId IS NULL` |
| `CLOSED` jobs never reopen | No code path transitions out of `CLOSED` |
| At most one `SignedAgreement` per negotiation | `@unique` on `negotiationId` |
| Money has no rounding errors | `budgetCents Int` — display as `budgetCents/100` |

Both CAS checks run inside a single `prisma.$transaction(…, { timeout: 5000 })`. If either affects 0 rows the transaction rolls back — no half-locked state is ever committed. See `WORKFLOW.md §6` for the millisecond-level sequence.

---

## 6. Raw SQL — The Critical Lock

What Prisma generates under the hood for `lockJob()`:

```sql
BEGIN;

-- CAS-1: claim the job (only if still OPEN)
-- $1 = freelancerId, $2 = jobId
UPDATE "jobs"
SET status = 'OCCUPIED',
    locked_by_freelancer_id = $1,
    locked_at = NOW(),
    updated_at = NOW()
WHERE id = $2 AND status = 'OPEN';
-- → count = 1 → win, count = 0 → someone else won

-- CAS-2: claim the freelancer (only if free)
-- $1 = freelancerId, $2 = jobId
UPDATE "users"
SET is_negotiating = true,
    active_job_id = $2,
    updated_at = NOW()
WHERE id = $1
  AND is_negotiating = false
  AND active_job_id IS NULL;
-- → count = 0 → ALREADY_NEGOTIATING → ROLLBACK

-- Create the room
-- $1 = freelancerId, $2 = jobId, $3 = negotiationId (cuid), $4 = clientId
INSERT INTO "negotiations" (id, job_id, client_id, freelancer_id)
VALUES ($3, $2, $4, $1);

COMMIT;
```

Postgres holds a row-level lock for the duration of each `UPDATE`. The second concurrent transaction waits, then re-evaluates `WHERE status='OPEN'` — it sees `OCCUPIED` and returns 0 rows. No `SELECT … FOR UPDATE`, no advisory lock needed.

---

## 7. Seed Data

`prisma/seed.ts` creates:

| User | Email | Role |
|---|---|---|
| Ava | `client@demo.dev` | CLIENT |
| Sam | `freelancer@demo.dev` | FREELANCER |
| Jordan | `jordan@demo.dev` | FREELANCER |

And 3 jobs owned by Ava with realistic `agreementText` values. All passwords: `password123` (bcrypt, 10 rounds).

Run: `npx prisma db seed` or `npm run db:seed` inside `backend/`.
