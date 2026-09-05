# Edge Cases & Failure Handling

> Every race condition, timeout, disconnect, and invalid state — and exactly how the system handles it.

---

## 1. Concurrency — Two Freelancers Click at the Same Millisecond

**Scenario:** `job.status = OPEN`. Freelancer A and Freelancer B click the same card within 1ms. Both requests hit the server concurrently.

**What happens:**

```sql
-- Both transactions execute CAS-1 concurrently:
UPDATE jobs SET status='OCCUPIED' WHERE id=:id AND status='OPEN';
```

Postgres serializes the two `UPDATE`s via a row-level lock:
1. First transaction acquires the lock, sees `status='OPEN'` → `count=1` → **wins**.
2. Second transaction waits, then re-evaluates `WHERE status='OPEN'` → job is now `OCCUPIED` → `count=0` → **loses**.

The loser receives `ack { ok: false, error: "JOB_TAKEN" }`. Frontend patches the card to the occupied overlay instantly — no reload.

**The freelancer lock (CAS-2) works identically:**

```sql
UPDATE users SET isNegotiating=true WHERE id=:freelancerId
  AND isNegotiating=false AND activeJobId IS NULL;
```

If a freelancer somehow fires two `job:lock` requests in parallel (double-click), only one `UPDATE` sees `isNegotiating=false`. The other gets `count=0` → `ALREADY_NEGOTIATING` → the job CAS-1 is rolled back.

**Both CAS checks run inside a single `prisma.$transaction({ timeout: 5000 })`.** If either fails, the whole transaction rolls back — no half-locked state is ever committed.

**Load test expectation:** Under `ReadCommitted` (Prisma default), the conditional `UPDATE … WHERE status='OPEN'` is atomic at the row level. This pattern is the standard compare-and-swap and is correct without `SERIALIZABLE` or `SELECT … FOR UPDATE`.

---

## 2. Freelancer Already in a Negotiation Tries to Lock Another Job

**Scenario:** Freelancer holds job X (`isNegotiating=true, activeJobId=X`). They try to click job Y (e.g., via a stale tab or by bypassing the UI guard).

**Frontend guard:** `JobCard` reads `myActiveJobId` from Zustand — `clickable = false` when `myActiveJobId !== null`. The click handler is not even attached.

**Server guard (belt and suspenders):** `CAS-2` in `lockJob()`:

```ts
UPDATE users SET isNegotiating=true, activeJobId=Y
WHERE id=:freelancerId AND isNegotiating=false AND activeJobId IS NULL
-- count=0 → throw ALREADY_NEGOTIATING → transaction rolls back
```

Ack: `{ ok: false, error: "ALREADY_NEGOTIATING" }`. Frontend toasts and redirects to `/negotiate/<existingId>`.

---

## 3. Re-entry — Freelancer Refreshes or Re-clicks Their Own Locked Job

**Scenario:** Freelancer holds job X, refreshes the page, and the feed still shows X as `OCCUPIED`. They click it again.

**Handling:** `lockJob()` detects `job.status === 'OCCUPIED' && lockedByFreelancerId === freelancerId` and returns the **existing live negotiation** instead of failing:

```ts
if (job.status === 'OCCUPIED' && job.lockedByFreelancerId === freelancerId) {
  const existing = await tx.negotiation.findFirst({ where: { jobId, outcome: null } });
  if (existing) return { ok: true, negotiation: existing, job };
}
```

Frontend receives `ok: true` and navigates to the same `/negotiate/:id`. Seamless.

**On reconnect (no click needed):** `sockets.ts` on `connection` checks `user.isNegotiating && activeJobId`, finds the live negotiation, clears `abandonedAt`, joins `negotiation:<id>`, and pushes `negotiation:state`.

---

## 4. Auto-Release — 15-Minute Inactivity Timeout

**Scenario:** Freelancer locks a job, enters the chat, then walks away. No messages, no heartbeat.

**Mechanism:**

| Component | Detail |
|---|---|
| `lastActivityAt` | Bumped on every `negotiation:message` and `presence:heartbeat` |
| Heartbeat | Frontend sends `presence:heartbeat` every 60s while in the room |
| Sweeper | `services/sweep.ts` — `setInterval(30s)` |
| Threshold | `lastActivityAt < now - 15min` → `EXPIRED` |

```ts
// sweep.ts — every 30 seconds
const stale = await prisma.negotiation.findMany({
  where: { outcome: null, lastActivityAt: { lt: new Date(now - 15*60*1000) } }
});
for (const n of stale) await finalizeNegotiation(n.id, 'EXPIRED');
```

On release:
- `job: OCCUPIED → OPEN` (returns to feed for everyone)
- `negotiation.outcome = EXPIRED`
- `user: isNegotiating=false, activeJobId=null`
- Broadcasts: `job:updated` (feed) + `negotiation:closed` (both) + `lock:released` (freelancer)

**Why 30s interval + 15min TTL (not exact 15min):** Worst case a negotiation lives 15m30s. Acceptable. Shorter intervals waste DB cycles.

---

## 5. Tab Close / Network Drop — Abandoned Negotiation

**Scenario:** Freelancer closes the tab or loses internet mid-negotiation.

**Mechanism:**

| Step | What happens |
|---|---|
| `socket.on("disconnect")` | Server decrements socket count for this user. If count reaches 0, sets `negotiation.abandonedAt = now()`. |
| Reconnect within 60s | `negotiation:join` or auto-rejoin clears `abandonedAt`, increments socket count — negotiation continues |
| No reconnect in 60s | Sweeper sees `abandonedAt < now - 60s` → `EXPIRED` → same release as §4 |

**Multi-tab handling:** The server tracks `socketCount` per user. `abandonedAt` is only set when the **last** socket disconnects (count → 0). This prevents closing one tab from killing an active negotiation in another tab.

```ts
// sockets.ts — connection tracking
const userSocketCount = new Map<string, number>();

io.on("connection", (socket) => {
  const prev = userSocketCount.get(user.id) ?? 0;
  userSocketCount.set(user.id, prev + 1);
  socket.data.userId = user.id;

  socket.on("disconnect", () => {
    const count = (userSocketCount.get(user.id) ?? 1) - 1;
    userSocketCount.set(user.id, count);
    if (count === 0 && user.role === "FREELANCER") {
      void markAbandoned(user.id);
    }
  });
});

// sweep.ts — also catches abandoned
const stale = await prisma.negotiation.findMany({
  where: {
    outcome: null,
    OR: [
      { lastActivityAt: { lt: inactiveCutoff } },
      { abandonedAt: { not: null, lte: abandonedCutoff } },
    ],
  }
});
```

**Why 60s grace (not instant):** Brief network blips and accidental refreshes should not kill a negotiation. The freelancer has a minute to reconnect.

---

## 6. Stale Card — Frontend Shows OPEN but Job Was Just Locked

**Scenario:** Freelancer's feed shows a card as `OPEN` (rendered 2s ago). Another freelancer locked it 500ms ago but the `job:updated` event hasn't arrived yet (network lag).

**Handling:** The click still fires `job:lock`. Server CAS-1 returns `count=0` → `JOB_TAKEN`. Frontend:

```ts
const res = await socket.timeout(5000).emitWithAck("job:lock", { jobId });
if (!res.ok && res.error === "JOB_TAKEN") {
  patchJob(job.id, { status: "OCCUPIED" }); // instantly flip the card
  showToast("Someone just took this job");
}
```

No stale state persists. The card corrects itself without a full feed reload.

---

## 7. Double Finalize — Decline and Timeout Race

**Scenario:** Freelancer clicks Decline at the same moment the sweeper decides the negotiation is expired. Both try to `finalizeNegotiation()`.

**Handling:** `finalizeNegotiation()` is idempotent:

```ts
const n = await tx.negotiation.findUnique({ where: { id } });
if (n.outcome) return null; // already finalized — no-op
```

Whichever transaction commits first sets `outcome`. The second sees `outcome !== null` and returns `null` — no double release, no error.

**Frontend handling:** The ack callback must handle `null` gracefully:

```ts
const res = await socket.timeout(5000).emitWithAck("negotiation:decline", payload);
if (res === null || res?.error === "ALREADY_CLOSED") {
  showToast("This negotiation already ended");
  router.push("/");
}
```

---

## 8. Sign After Release — Freelancer Signs an Already-Released Job

**Scenario:** Job was released (timeout) 2s ago. Freelancer's modal is still open and they click `SIGN & CONFIRM`.

**Handling:** `finalizeNegotiation(ACCEPTED)` checks:

```ts
if (job.status === 'OCCUPIED' && job.lockedByFreelancerId === freelancerId) {
  // only then flip to CLOSED
} else {
  throw new NegotiationError('STALE', 'Job was released while signing');
}
```

If the job is already `OPEN`, the sign fails. Frontend shows "This negotiation has ended — the job was released."

---

## 9. Client Disconnects / Never Joins

**Scenario:** Client posted the job but is offline when a freelancer locks it.

- `negotiation:started` is emitted to `user:<clientId>` — if offline, it's missed (Socket.IO does not queue for disconnected sockets).
- On next visit, client sees `GET /api/jobs/mine` → job shows `OCCUPIED` with `negotiations: [{ id }]` → "Negotiating with Sam — Open chat".
- Chat history is persisted in `messages` — nothing is lost. Client sees all messages on `negotiation:join`.

No message loss — storage is Postgres, not in-memory.

---

## 10. Auth Edge Cases

| Case | Handling |
|---|---|
| Expired JWT | `verifyToken` returns `null` → socket disconnects, REST returns `401` |
| Freelancer tries `POST /api/jobs` | `requireRole("CLIENT")` → `403` |
| Non-participant tries `negotiation:join` | `buildNegotiationState` checks `clientId === userId OR freelancerId === userId` → `NOT_PARTICIPANT` |
| Non-freelancer tries `job:lock` | `if (user.role !== "FREELANCER") return ack { error: "UNAUTHORIZED" }` |
| Missing token on socket | `verifyToken(undefined)` → `null` → `socket.disconnect()` (force close) |

---

## 11. Invalid Payloads

Every REST body and every socket payload is validated with **Zod** before touching the DB:

| Field | Constraint | Error |
|---|---|---|
| `title` | 4–120 chars | `BAD_REQUEST` + Zod details |
| `description` | 10–4000 chars | `BAD_REQUEST` |
| `agreementText` | 20–12,000 chars | `BAD_REQUEST` |
| `budgetCents` | int 100–50M | `BAD_REQUEST` |
| `body` (chat) | 1–2000 chars | `BAD_REQUEST` |
| `jobId` / `negotiationId` | non-empty string | `BAD_REQUEST` |

---

## 12. Database Failures

| Failure | Mitigation |
|---|---|
| Transaction timeout (5s) | Prisma throws → ack `INTERNAL`, client retries |
| Postgres down | REST returns `500`, socket handlers catch and ack `INTERNAL` |
| Sweeper DB error | `try/catch` + `console.error` — next interval retries |

No partial writes — every lock/release is a single transaction.

---

## 13. Quick Reference — Outcome Matrix

| Event | Job Status | User Lock | Negotiation Outcome | Feed |
|---|---|---|---:|---|
| Lock (win) | `OPEN → OCCUPIED` | `false → true` | `null` (live) | Card → Occupied |
| Decline | `OCCUPIED → OPEN` | `true → false` | `DECLINED` | Card → Available |
| Sign | `OCCUPIED → CLOSED` | `true → false` | `ACCEPTED` | Card → Filled |
| Timeout (inactive) | `OCCUPIED → OPEN` | `true → false` | `EXPIRED` | Card → Available |
| Timeout (disconnect) | `OCCUPIED → OPEN` | `true → false` | `EXPIRED` | Card → Available |
| Race lose | no change | no change | — | Card → Occupied (via patch) |
