# Setup & Run Guide

> From zero to running board in under 5 minutes. Prerequisites, env vars, migrations, seed, and scripts.

---

## 1. Prerequisites

| Requirement | Version | Check |
|---|---:|---|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| PostgreSQL | ≥ 14 | `psql --version` |
| (optional) Docker | any | `docker --version` — easiest way to run Postgres |

---

## 2. Clone & Install

```bash
git clone <repo-url> && cd freelance-job-board

# Backend
cd backend && npm install

# Frontend (in a second terminal)
cd frontend && npm install
```

---

## 3. Environment Variables

### 3.1 Backend — `backend/.env`

Create from the example:

```bash
cd backend && cp .env.example .env
```

| Variable | Example | Required | Notes |
|---|---:|---:|---|
| `DATABASE_URL` | `postgresql://negotia:negotia@localhost:5432/negotia?schema=public` | ✓ | Prisma connection string |
| `JWT_SECRET` | `change-me-in-production` | ✓ | Any long random string |
| `PORT` | `4000` |  | API + Socket.IO port |
| `CORS_ORIGIN` | `http://localhost:3000` |  | Comma-separated if multiple origins |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.2 Frontend — `frontend/.env.local`

```bash
cd frontend && cp .env.example .env.local  # if present, else create:
```

| Variable | Example | Required |
|---|---:|---:|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | ✓ |

This is the only frontend env var — it tells `lib/api.ts` and `lib/socket.ts` where the backend lives.

---

## 4. PostgreSQL

### Option A — Docker (recommended)

```bash
docker run --name negotia-pg -e POSTGRES_USER=negotia \
  -e POSTGRES_PASSWORD=negotia -e POSTGRES_DB=negotia \
  -p 5432:5432 -d postgres:16-alpine

# Verify
docker logs negotia-pg
```

`DATABASE_URL` for this setup:

```
postgresql://negotia:negotia@localhost:5432/negotia?schema=public
```

### Option B — Local Postgres

```bash
createdb negotia
createuser negotia
psql -c "ALTER USER negotia WITH PASSWORD 'negotia';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE negotia TO negotia;"
```

Update `DATABASE_URL` accordingly.

---

## 5. Migrate & Seed

```bash
cd backend

# Generate Prisma Client + run migrations
npx prisma migrate dev --name init

# Seed demo users + jobs
npx prisma db seed
#  — or —
npm run db:seed
```

Seed creates:

| User | Email | Password | Role |
|---|---|---:|---|
| Ava | `client@demo.dev` | `password123` | CLIENT |
| Sam | `freelancer@demo.dev` | `password123` | FREELANCER |
| Jordan | `jordan@demo.dev` | `password123` | FREELANCER |

And 3 jobs owned by Ava with realistic `agreementText`.

Verify:

```bash
npx prisma studio          # opens http://localhost:5555 — browse tables
```

---

## 6. Run

Two terminals:

```bash
# Terminal 1 — Backend (API + Socket.IO + sweeper)
cd backend && npm run dev
# → ✦ Negotia API + Socket.IO listening on http://localhost:4000

# Terminal 2 — Frontend
cd frontend && npm run dev
# → ▲ Next.js 14 — http://localhost:3000
```

Open `http://localhost:3000` — you should see the login page.

---

## 7. Quick Smoke Test (Two Browsers)

1. **Browser A** (normal window): login as `freelancer@demo.dev` → see the feed.
2. **Browser B** (incognito): login as `client@demo.dev` → see "My Jobs".
3. In Browser A, click an `OPEN` card → StatusBar appears, redirected to `/negotiate/:id`.
4. In Browser B, the same job flips to "Negotiating with Sam" in real time.
5. In Browser A, type a message → appears in Browser B instantly.
6. Click **Decline** → job returns to feed in both browsers.
7. Lock again → click **Accept** → read agreement → **Sign & Confirm** → job becomes `CLOSED`.

To test the race: open two freelancer incognito windows and click the same card simultaneously — one wins, one sees the occupied overlay.

---

## 8. Scripts Reference

### Backend (`backend/package.json`)

| Script | What it does |
|---|---|
| `npm run dev` | `tsx watch src/index.ts` — auto-reload on file change |
| `npm run build` | `tsc -p tsconfig.json` → `dist/` |
| `npm start` | `node dist/index.js` — production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:generate` | `prisma generate` |
| `npm run db:seed` | `tsx prisma/seed.ts` |

### Frontend (`frontend/package.json`)

| Script | What it does |
|---|---|
| `npm run dev` | `next dev` — `http://localhost:3000` |
| `npm run build` | `next build` |
| `npm start` | `next start` |
| `npm run typecheck` | `tsc --noEmit` |

---

## 9. Production Checklist

- [ ] Set a strong `JWT_SECRET` (32+ random bytes)
- [ ] Set `DATABASE_URL` to the managed Postgres instance
- [ ] Set `CORS_ORIGIN` to the deployed frontend URL (no wildcard)
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`) on the server
- [ ] Build both apps: `npm run build` in each
- [ ] Use a process manager (`pm2`, `systemd`, or Docker) for `node dist/index.js`
- [ ] Enable HTTPS — Socket.IO needs `wss://` in production
- [ ] For multi-instance WS: add Redis adapter (`@socket.io/redis-adapter`)
- [ ] Back up Postgres regularly — negotiations and signed agreements are audit records

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `Can't reach database` | Check `DATABASE_URL` and that Postgres is running (`docker ps` or `pg_isready`) |
| `P1001` Prisma error | Wrong host/port in `DATABASE_URL` |
| `401 Unauthorized` on every request | `JWT_SECRET` mismatch between token creation and verification — restart backend after changing it |
| Socket connects then immediately disconnects | Invalid/expired token in `localStorage.negotia_token` — clear it and re-login |
| Feed is empty after seed | `npx prisma db seed` didn't run — run it and check `npx prisma studio` |
| `EADDRINUSE :4000` | Another process on 4000 — `lsof -i :4000` then `kill <pid>` or change `PORT` |
| Tailwind styles missing | `npm install` in `frontend/` and restart `npm run dev` |

---

## 11. Project Structure (Quick Map)

```
backend/                 # Express + Socket.IO + Prisma
  prisma/
    schema.prisma
    seed.ts
  src/
    index.ts             # server entry — Express + http + io + sweep
    config.ts            # env + TTL constants
    db.ts                # PrismaClient
    errors.ts            # NegotiationError
    auth.ts              # JWT helpers
    middleware.ts        # requireAuth / requireRole
    validation.ts        # Zod schemas
    services/
      negotiation.ts     # lockJob / finalizeNegotiation / messages
      state.ts           # buildNegotiationState
      sweep.ts           # TTL sweeper
    sockets.ts           # all Socket.IO handlers
    routes/
      auth.ts
      jobs.ts

frontend/                # Next.js 14 + Tailwind + Zustand
  app/
    layout.tsx
    page.tsx             # board shell
    login/page.tsx
    post/page.tsx
    negotiate/[id]/page.tsx
  components/
    JobCard.tsx          # 5 visual states
    JobFeed.tsx
    StatusBar.tsx
    ChatRoom.tsx
    AgreementModal.tsx
    Header.tsx
    icons.tsx
  lib/
    types.ts
    api.ts
    socket.ts
    store.ts             # Zustand — global lock
    useRealtime.ts       # job:updated / lock:released
```

Full details → `ARCHITECTURE.md`.
