# Mina Minks — Lash Booking Demo (MVP)

A competition-ready, end-to-end booking prototype for **Mina Minks**: public lash-style
discovery, an explainable style finder, a five-step appointment flow, client booking lookup,
aftercare guidance, and a password-protected studio dashboard.

> ⚠️ **Everything in this repository is SAMPLE / DEMO DATA.** Service names, prices,
> durations, opening hours, contact details, policies and aftercare copy are illustrative
> placeholders pending Mina's approval. No payments are collected and no real customer
> data should be entered.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite 6 + Tailwind CSS 3 + Lucide icons + React Router 6 |
| Backend | FastAPI + Pydantic v2 + SQLAlchemy 2 + SQLite + Uvicorn |
| Tests | Pytest/TestClient (API), Vitest (UI units), Playwright-core + Google Chrome (browser journey) |
| Timezone | All stored times are UTC ISO-8601; the UI formats them in `Africa/Accra` |

---

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional; change the admin password!
python -m app.seed --reset         # seed demo data (safe to re-run)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health>
- Default demo admin (from `.env.example`): `mina@example.com` / `demo-password-change-me`
  — **override `ADMIN_PASSWORD` before any real use.**

### 2. Frontend

```bash
cd frontend
npm ci
cp .env.example .env               # optional; defaults to http://localhost:8000
npm run dev                        # strict port 5174
```

Open <http://localhost:5174>. (Port 5173 is also an allowed CORS origin if you change the Vite port.)

### 3. Reset the demo

```bash
cd backend && python -m app.seed --reset
```

This restores services, working hours and one sample appointment, and clears bookings,
admin sessions, blocked dates and service edits. The browser E2E script does this
automatically before each run.

---

## Try the demo journey

1. **Home** (`/`) — positioning, sample data banner, calls to action.
2. **Services** (`/services`) — sample menu with prices/durations and an approval disclaimer.
3. **Style finder** (`/recommend`) — deterministic, rule-based recommendation with a plain-language explanation; users can accept the suggestion or override it. Not professional advice.
4. **Book** (`/book`) — choose service → date → time → details → review → confirm.
5. **Confirmation** (`/booking/MM-YYYYMMDD-XXXXXX`) — reference, details and lookup link.
6. **Lookup** (`/lookup`) — find an appointment with reference + matching email or phone.
7. **Aftercare** (`/aftercare`) — sample guidance, clearly marked as pending approval.
8. **Admin** (`/admin`) — sign in, dashboard counters, bookings table with search / status / date filters, booking detail modal (status, internal notes, cancel), working hours, blocked dates and service toggles.

### Double-booking protection (the core invariant)

- `POST /api/bookings` runs inside a single SQLite **write transaction** begun with
  `BEGIN IMMEDIATE` and guarded by a process-wide `threading.RLock`.
- Overlap check compares half-open intervals `[start, end)` against all **active**
  bookings (`pending`, `confirmed`, `completed`); cancelled bookings release the slot.
- A losing request receives **HTTP 409** with `code: "slot_taken"`; the UI refreshes
  availability and asks the client to pick another time.
- Availability generation applies the same rules, so taken slots disappear from the picker.
- The automated collision test fires eight concurrent requests at one slot and asserts
  exactly one `201` and seven `409`s.
- In-memory rate limits protect login (`10/min`) and booking (`30/min`) endpoints.

---

## Tests

```bash
# Backend: 11 tests incl. double-booking races, auth, lookup and admin rules
cd backend && .venv/bin/python -m pytest -q

# Frontend units (formatting, API client, recommendation rules)
cd frontend && npm test

# Frontend production build
cd frontend && npm run build

# Full browser journey (needs both servers running and Google Chrome)
cd frontend && npm run test:e2e
```

`test:e2e` resets the demo DB, drives two real Chrome pages through a conflicting
booking, verifies the 409 message in the UI, checks the style finder and aftercare
disclaimer, signs in to admin, updates the booking status and asserts the table reflects it.
Set `CHROME_PATH`, `E2E_WEB_URL`, `VITE_API_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` to
override defaults. Use `http://localhost:5174` (not `127.0.0.1`) so the CORS allow-list matches.

---

## Configuration

All backend settings are environment variables (see `backend/.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./mina_minks.db` | SQLite database location |
| `FRONTEND_ORIGIN` | `http://localhost:5173,http://localhost:5174` | Comma-separated CORS allow-list |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `mina@example.com` / `demo-password-change-me` | Dashboard credentials |
| `ADMIN_SESSION_TTL_MINUTES` | `480` | Bearer-token lifetime |
| `SLOT_INCREMENT_MINUTES` | `30` | Booking grid granularity |
| `BOOKING_LEAD_TIME_MINUTES` | `30` | Minimum notice |
| `BOOKING_HORIZON_DAYS` | `60` | How far ahead clients can book |
| `BUSINESS_TIMEZONE` | `Africa/Accra` | Display timezone |
| `MAX_LOGIN_ATTEMPTS_PER_MINUTE` / `MAX_BOOKING_REQUESTS_PER_MINUTE` | `10` / `30` | Basic abuse limits |

Frontend: `VITE_API_URL` (default `http://localhost:8000`).

Admin passwords are salted with PBKDF2-HMAC-SHA256. Bearer tokens are random, hashed with
SHA-256 in the database, expire, and can be revoked. The frontend keeps the token in
`sessionStorage`.

---

## Security notes / prototype limitations

This is a hackathon prototype, **not** a production booking system:

- Serve over HTTPS and use secure, HTTP-only cookies in production; `sessionStorage` is
  readable by scripts and is cleared when the tab closes.
- The in-memory rate limiter is per-process and resets on restart; use a shared store
  (e.g. Redis) when scaling out.
- The SQLite write lock protects a single process. Multiple app workers need a database
  that supports row-level locking (e.g. Postgres with `SELECT … FOR UPDATE`), or an
  application-level distributed lock.
- Sessions, demo credentials and sample data must be replaced before real clients use it.
- There is no email/SMS verification of the booking lookup beyond matching contact details,
  and no payment processing by design.

---

## Repository layout

```
backend/
  app/
    main.py            FastAPI app, CORS, error handling, health, docs
    core/config.py     Environment-driven settings
    database.py        SQLAlchemy engine/session, SQLite write-lock helper
    models.py          ORM models (services, hours, closures, bookings, sessions)
    schemas.py         Pydantic request/response contracts
    seed.py            Demo seed and `--reset` command
    routers/           public + admin API endpoints
    services/          availability, booking, auth, recommendation-independent logic
  tests/               Pytest/TestClient suites incl. collision acceptance test
frontend/
  src/
    pages/             Home, Services, Recommendation, Booking, Confirmation,
                       Lookup, Aftercare, Admin
    components/        Layout, shared UI, admin panels
    services/api.ts    Typed API client
    services/format.ts Accra timezone formatting helpers
    scripts/           browser-smoke.mjs (Playwright via Chrome)
```

No secrets or production customer data are committed. `.venv/`, `node_modules/`,
`dist/`, `.env`, local SQLite files and build caches are ignored.
