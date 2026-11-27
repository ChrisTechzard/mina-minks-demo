# Mina Minks — Lash Booking Demo (MVP)

A competition-ready, end-to-end booking prototype for **Mina Minks**: public lash-style
discovery, an explainable style finder, a five-step appointment flow, client booking lookup,
aftercare guidance, and a password-protected studio dashboard.

> ⚠️ **This is an independent demonstration, not the live Mina Minks website.**
> Booking services, prices, durations, opening hours, policies and aftercare copy used by
> the demo are **sample data** pending Mina's approval. Publicly published name, founder,
> contact details, social links and menu reference are labelled as such. No published
> price, duration, deposit or cancellation rule is enforced by this demo. No payments are
> collected and no real customer data should be entered.

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
python -m app.seed                 # add demo data without removing existing records
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

### 3. Demo data only

`python -m app.seed` is additive and never removes records. `python -m app.seed --reset`
is destructive and should only be run against a disposable local demo database — never
against a database containing business or customer records. The optional browser E2E
script resets its own temporary database, not `backend/mina_minks.db`.

---

## Public business reference (verified from minaminks.com)

The following details are displayed in the UI as **published reference information**:

- Business: **Mina Minks** · Lash extensions by **Beryl Addo** · Accra, Ghana.
- Published tagline: “Elevate your beauty, one lash at a time. Lash extensions by Beryl Addo, tailored to you.”
- Phone `+233 50 529 8278`, email `minaminks01@gmail.com`.
- WhatsApp `wa.me/233505298278`, Instagram `@mina.minkss`, Snapchat link and studio map link.
- Published menu reference: Doll Classic, MM Classic, Wet Set, Hybrid, Volume, Mega Volume,
  Classic Refill and MM Classic Refill with their published descriptions, prices and
  duration labels (see `frontend/src/content/publicInfo.ts`).

**Requires Mina's approval before it can be treated as real booking data:** the demo menu
prices/durations used for booking, working hours, deposits, late-fee/cancellation rules,
aftercare wording, and the supplied studio photograph. The original photograph at
`/home/chris_techzard/Pictures/Mina.jpeg` was not modified; an optimised copy is served
from `frontend/public/mina-studio.jpg` and is labelled “pending approval”.

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
# Backend: 25 tests incl. double-booking races, auth, lookup, snapshots and admin rules
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
| `DATABASE_URL` | `sqlite:///./mina_minks.db` | SQLite locally; hosted PostgreSQL URL in deployment |
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

`DATABASE_URL` accepts both `postgresql+psycopg://…` and legacy `postgres://…` provider URLs.
SQLite remains the local default; PostgreSQL uses the same additive migration path and does
not receive SQLite-only `PRAGMA` statements.

---

## Deployment (free tiers only)

`render.yaml` defines a free Render stack:

1. **Render Postgres** (`mina-minks-demo-db`, free plan) — injected as `DATABASE_URL`.
2. **FastAPI web service** (`mina-minks-demo-api`, free plan) — `healthCheckPath: /api/health`.
3. **Static site** (`mina-minks-demo-web`) — Vite build with `VITE_API_URL` set at build time
   and an SPA rewrite of `/*` to `/index.html`.

Steps:

1. Sign in to Render and authorise it to read the private GitHub repository.
2. **New → Blueprint → select `mina-minks-demo`**. Render reads `render.yaml`.
3. When prompted, set `ADMIN_PASSWORD` to a demo-only value. Nothing secret is committed.
4. Deploy, then verify `https://mina-minks-demo-api-1xa7.onrender.com/api/health`
   returns `{"status":"ok",...}` and open
   `https://mina-minks-demo-web-1xa7.onrender.com`. Render appends a unique suffix
   to service names, so use the real hostnames shown in its dashboard.
5. If service names are auto-renamed, update `FRONTEND_ORIGIN` (API) and `VITE_API_URL`
   (frontend build) to the real URLs and redeploy.

Free-tier limits to know: Render free web services spin down after 15 minutes idle (first
request after that takes ~1 minute), and **free Render Postgres expires 30 days after
creation**. No paid plan, add-on or card is required for this demo. For a longer-lived
demo, create a free Neon Postgres project and replace `DATABASE_URL` with its connection
string; do not upgrade either provider to a paid plan.

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

## GitHub Pages fallback (static presentation)

`.github/workflows/deploy-pages.yml` builds the frontend for a project Pages site at
`/mina-minks-demo/` and publishes `frontend/dist`. It is a static fallback only;
the primary deployment remains the Render static site and is unchanged.

Public URL (verified live):
**https://christechzard.github.io/mina-minks-demo/**

Pages was enabled with **Source: GitHub Actions**, and the repository was made
**public** because GitHub Pages on a free personal account requires a public
repository (Pro/Team can keep it private). Direct links are handled by a copied
`404.html`.

The static build talks to the live demo API at
`https://mina-minks-demo-api-1xa7.onrender.com`. Because the browser origin is
`https://christechzard.github.io`, that origin is included in the API's
`FRONTEND_ORIGIN` list in `render.yaml` so CORS permits the read-only calls. If the
API is asleep or unavailable, the UI shows explicit "Menu unavailable" /
"Booking not submitted" errors. It never fabricates a confirmation: the
confirmation screen only renders data returned by a real successful API response.

To republish: **Actions → Deploy frontend to GitHub Pages → Run workflow**. No
secrets are used in the workflow.

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
    content/publicInfo.ts  Verified public reference data
    scripts/           browser-smoke.mjs (Playwright via Chrome)
render.yaml                Free Render blueprint (web, API, Postgres)
```

No secrets or production customer data are committed. `.venv/`, `node_modules/`,
`dist/`, `.env`, local SQLite files and build caches are ignored.
