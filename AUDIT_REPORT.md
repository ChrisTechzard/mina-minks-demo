# Mina Minks — Read-Only Technical Audit

**Date:** 2026-11-27
**Scope:** Existing repository at `/home/chris_techzard/projects/mina-minks` only. No files were edited, created, deleted, renamed, installed or migrated during the audit. No changes were made to `https://www.minaminks.com`; it was fetched read-only as a reference only. No real payments were initiated.

---

## Commands executed in this audit (exact)

| # | Command / action | Data impact |
|---|---|---|
| 1 | `find . -type f -not -path './.git/*' -not -path '*/node_modules/*' -not -path '*/.venv/*' -not -path '*/__pycache__/*' -not -path '*/dist/*' -not -name '*.pyc' \| sort` | none |
| 2 | `find /home/chris_techzard/projects/mina-minks/backend/tests -type f -maxdepth 2 -print && sed -n '1,60p' .../backend/tests/conftest.py` | none |
| 3 | Four `explore` subagents launched with explicit **DO NOT modify any files** instructions | none |
| 4 | `grep -RniE 'minaminks\.com\|production\|deploy\|backup\|env file' ...` and repo-wide payment-keyword search | none |
| 5 | `find . -maxdepth 3 -type f \( -iname 'Dockerfile*' -o -iname 'docker-compose*' -o -iname '*.yml' -o -iname '*.yaml' -o -iname 'Procfile' -o -iname '*.toml' -o -iname '*backup*' -o -iname '*migration*' -o -iname 'alembic*' \) ...` | none (no matches) |
| 6 | `cd backend && .venv/bin/python -m pytest -q -p no:cacheprovider` | **safe**: `conftest.py:9-13` points `DATABASE_URL` at a unique temp DB in `/tmp`; `-p no:cacheprovider` prevented `.pytest_cache` writes; local `mina_minks.db` untouched. Result: **11 passed, 1 warning** |
| 7 | `cd backend && .venv/bin/python -c "... sqlite3.connect('file:mina_minks.db?mode=ro', uri=True) ... counts ..."` | read-only URI mode |
| 8 | `cd backend && .venv/bin/python -c "from app.schemas.booking import BookingCreate; ... phone validation probe ..."` | in-memory validation only |
| 9 | `git status --short --untracked-files=all \| head -10 && git diff --stat` | none |
| 10 | `webfetch https://www.minaminks.com` and `webfetch https://www.minaminks.com/book` | read-only HTTP GET |
| 11 | Many `read` tool calls on source files | none |

**Tests deliberately NOT run in this audit:** `npm test`, `npm run build`, `npm run test:e2e`. The E2E script resets the local demo DB (`frontend/scripts/browser-smoke.mjs:9-18`), so it was excluded per instruction. Historical results from earlier in this project are labelled as such below, not re-verified here.

---

## A. Executive summary

An independent, self-contained demo MVP has been built: a React/TypeScript SPA with a FastAPI/SQLite backend covering public discovery, an explainable style finder, a five-step booking flow, confirmed references, verified booking lookup, sample aftercare, and a protected admin workspace (dashboard, appointment management, working hours, closures, service toggles). The core double-booking invariant is enforced server-side with a SQLite write transaction and overlap checks; it has dedicated concurrency tests.

The repo is entirely **untracked** (`git status` shows `?? .gitignore`, `?? README.md`, `?? backend/`, `?? frontend/`; `git diff --stat` empty) — there is no commit history. There are **no deployment configs, no migrations, no backups, no payment code, no real business branding/contact details**, and no references to the live domain. The existing website is untouched and cannot be affected by this repo as it stands.

The platform is functional as a prototype, but several correctness/security/data-integrity issues must be resolved before any real adoption — most importantly an unprotected admin reschedule path, absence of price/duration snapshots, destructive reset tooling, weak phone validation, and prototype-grade session handling.

---

## B. Exact technology stack and architecture

**Frontend** (`frontend/package.json:1-31`): React 18.3.1, TypeScript 5.7.2, Vite 6.4.6, Tailwind CSS 3.4.17, lucide-react 0.468.0, react-router-dom 6.28.0; dev/test: Vitest 2.1.9, playwright-core 1.49.1 with Google Chrome. Dev server strict port **5174** (`frontend/vite.config.ts:6-11`). Fonts loaded from Google Fonts CDN (`frontend/src/index.css:1`); palette/type scale in `frontend/tailwind.config.js:5-22`.

**Backend** (`backend/requirements.txt:1-7`): FastAPI 0.115.6, uvicorn[standard] 0.34.0, SQLAlchemy 2.0.36, Pydantic 2.10.4, pydantic-settings 2.7.0, pytest 8.3.4, httpx 0.28.1. Runs on port **8000**.

**Architecture:** SPA → typed JSON client (`frontend/src/services/api.ts:25,65-90`) → REST API (`backend/app/main.py:81-85`) → SQLAlchemy ORM → SQLite with WAL, foreign keys and 30s busy timeout (`backend/app/database.py:20-46`). Env-driven config (`backend/app/core/config.py:11-32`). CORS allow-list defaults to `http://localhost:5173,http://localhost:5174` (`config.py:23`, `main.py:42-48`). All timestamps persisted as UTC ISO-8601 strings (`core/time.py:1,14-25`); displayed in `Africa/Accra` (`format.ts:3-41`). Auth uses opaque random bearer tokens, SHA-256 hashed at rest (`core/security.py:42-51`), held in browser `sessionStorage` (`useAdminSession.ts:5,16,49`).

**Independence from live site — evidence:** no Dockerfile, compose, CI/CD, hosting, DNS or backup files exist (command #5 returned nothing); repo-wide grep found no `minaminks.com` reference; demo contact details are placeholders (`Footer.tsx:41-45`). Live site reference (read-only): real phone `+233 50 529 8278`, email `minaminks01@gmail.com`, published booking policies/FAQs/aftercare, shop/gallery/reviews/training, social links and its own `/book` flow.

---

## C. Feature classification

### Working and verified

| Feature | Evidence |
|---|---|
| Public services, availability, aftercare APIs | `routers/services.py:17-31`; `routers/availability.py:15`; `routers/aftercare.py:13-15` |
| Booking creation with 409 conflict, lookup with email/phone verification | `routers/bookings.py:26-70`; `services/booking.py:79-133` |
| Double-booking prevention incl. 8-way race, overlap, non-overlap, cancellation release, past slot rejection | `backend/tests/test_booking_collisions.py:24-118`; fresh `pytest` run: **11 passed** |
| Admin login/me/logout, dashboard, bookings list/detail/patch/cancel, hours, closures, service toggle — all bearer-protected | `routers/admin.py:46-65,68-253`; `tests/test_admin_api.py:12-113` |
| Password hashing (PBKDF2-HMAC-SHA256, 240k iterations, salted, constant-time verify) | `core/security.py:10-39` |
| Five-step booking UI with loading/error/empty states and 409 recovery | `pages/BookingPage.tsx:43-372` (esp. 79-107, 217-238) |
| Recommendation with reasons, override, not-advice disclaimer; 4 unit tests | `services/recommendation.ts:64-136`; `recommendation.test.ts:14-48`; `RecommendationPage.tsx:173-205` |
| Sample-data disclaimers across public UI and API | `seed.py:20-85`; `services/aftercare.py:7-44`; `HomePage.tsx:33-62`, `ServicesPage.tsx:21-37`, `Footer.tsx:48-49` |
| Image fallback, responsive grids/tables/mobile nav | `ImageWithFallback.tsx:9-25`; `Navbar.tsx:27-81`; `ServicesPage.tsx:49-85` |
| Read-only DB state observed: 6 services, 7 working hours, 1 booking (confirmed), 1 admin user, 1 session | command #7 |

### Partially implemented

- **Admin reschedule:** API accepts `start_at` (`schemas/admin.py:82-96`, `services/admin.py:131-140`) but the modal exposes only status and notes (`AdminBookingsPanel.tsx:194-211`).
- **Service management:** API supports name/description/price/duration edits (`schemas/admin.py:187-201`) but UI only toggles active state (`AdminSettingsPanel.tsx:227-238`).
- **Booking horizon mismatch:** backend 60 days (`config.py:29`) vs frontend 14-day date list (`BookingPage.tsx:63-66`).
- **Rebooking:** "Rebook" links to a generic `/book` with no prefill (`ConfirmationPage.tsx:93`, `LookupPage.tsx:131`) although aftercare copy promises rebooking from confirmation (`aftercare.py:40-43`).
- **Closures:** one interval per date max (`models/__init__.py:106-117`; duplicate guard `routers/admin.py:207-209`); UI supports add/delete, not edit (`AdminSettingsPanel.tsx:183-220`).
- **Rate limiting:** implemented, but per-process and keyed on `request.client.host` (`rate_limit.py:1-36`, `routers/bookings.py:22-23`, `routers/admin.py:42,70`).
- **Terms:** "By confirming you agree to the demo terms" (`BookingPage.tsx:337`) with no terms page or checkbox.
- **Customer data protection:** masking works (`schemas/booking.py:82-98`), but no privacy notice, retention policy or deletion path.

### Not implemented

- **Payments entirely:** exhaustive keyword search found only "no payment" disclaimers (`README.md:9,154`, `schemas/booking.py:79`, `BookingPage.tsx:274,337`, `ServicesPage.tsx:34`). No deposit model, payment states, verification, webhook endpoints, sandbox config or provider SDKs. **No real payments were initiated.**
- Migrations (no Alembic/alembic.ini), backups, Dockerfile/compose, CI/CD, production hosting config, monitoring/alerting.
- Email/SMS notifications; customer-side cancel/reschedule; customer accounts; multi-admin roles; audit trail of admin edits.
- Real business branding, logo, contact details, published policies from the live site (intentionally sample here).
- Capacity/buffer rules (one appointment per client/day, turnaround time between services).
- Tests for reschedule concurrency, session expiry, rate limits, CORS enforcement, partial closures, price-change effects.

### Implemented but defective

- **Unprotected reschedule/reactivation:** `services/admin.py:121-156` performs conflict checks and `db.commit()` **without** `BOOKING_WRITE_LOCK` or `BEGIN IMMEDIATE` (contrast `services/booking.py:82-84`). No lead-time check on reschedule; no status-transition validation (any status → any status).
- **No price/duration snapshot:** `Booking` has no price/duration columns (`models/__init__.py:73-84`); all responses read live service values (`schemas/admin.py:77-78`, `services/booking.py:122-128`, `routers/bookings.py:65-66`). Editing a service retroactively changes historic bookings and confirmations.
- **Weak phone validation:** `_PHONE_PATTERN = ^\+?[0-9()\s-]{7,20}$` (`schemas/booking.py:13`). Verified probe (command #8): `'((((((('` and `'-------'` are **ACCEPTED**; lookup digit-normalisation (`routers/bookings.py:54-56`) turns those into an empty string.
- **Destructive reset:** `reset_schema()` drops all tables (`database.py:83-93`) and `seed.py:137-143` calls it; if `DATABASE_URL` were ever pointed at a shared DB, all data is lost.
- **Admin credential source of truth:** `init_db()` rewrites the password hash from env on every startup (`database.py:69-80`); tokens survive password changes until expiry/revocation. Single account only.
- **Public exposure of inactive services:** `GET /api/services/{id}` uses `include_inactive=True` (`routers/services.py:29-31`) and `active_only=false` is accepted (`services.py:20`).
- **Stale availability fetch:** `useAvailability.ts:17-36` has no cancellation/stale-response guard.
- **Accessibility gaps:** `Alert.tsx:19-29` lacks `role="alert"`/`aria-live`; admin modal lacks focus trap/Escape handling (`AdminBookingsPanel.tsx:173-215`); stepper labels hidden on small screens (`Stepper.tsx:25`).
- **Confirmation bound to sessionStorage:** `BookingPage.tsx:93` / `ConfirmationPage.tsx:8-18` — opens blank on another device/tab (fallback screen exists).
- **Dead code:** `cardFor()` branches in `recommendation.ts:37-61` all return an empty card; scoring occurs via `add()` in `recommend()`.
- **Misleading dashboard metric:** `sample_value_ghs` uses current service prices (`services/admin.py:103-108`), labelled "not revenue" in UI (`AdminOverview.tsx:42-48`).
- **Custom `ValidationError` inherits `Exception`, not `ValueError`** (`core/errors.py:6,24-26`); validators in `schemas/booking.py` and `schemas/admin.py` can return HTTP `500` instead of `422`.

---

## D. Critical technical and business risks, ranked by severity

| Rank | Risk | Severity | Evidence |
|---|---|---|---|
| 1 | Admin reschedule/reactivation is non-atomic and unbounded; concurrent booking + reschedule can double-book; past/too-soon times allowed | **Critical** (data integrity) | `services/admin.py:121-156` vs `services/booking.py:82-84` |
| 2 | No price/duration snapshot — business data corruption when services edited; historical confirmations change | **Critical** (business/accounting) | `models/__init__.py:73-84`, `schemas/admin.py:77-78` |
| 3 | Prototype auth: token in `sessionStorage`, env password rewritten at startup, no HTTPS/roles/MFA, tokens not revoked on password change | **Critical** before real use | `useAdminSession.ts:16,49`, `database.py:69-80`, `core/security.py:48-51`, `AdminLogin.tsx:79-82` |
| 4 | Destructive `--reset` drops every table; misconfigured URL could wipe real data | **High** | `database.py:83-93`, `seed.py:137-143` |
| 5 | Invalid phone numbers accepted; weak customer data quality and lookup ambiguity | **High** | `schemas/booking.py:13`, verified command #8 |
| 6 | Rate limits ineffective behind proxy/multi-worker; brute-force feasible | **High** | `rate_limit.py:1-36`, `routers/admin.py:42,70` |
| 7 | No migrations/backups/deployment config — schema evolution and recovery undefined | **High** | command #5, no files found |
| 8 | Published business policies/branding not mirrored; sample prices/durations could be mistaken for real | **High** (business) | `seed.py:20-85`, `Footer.tsx:41-45`; live site reference |
| 9 | No notification channel — clients get no email/SMS confirmation; no way to cancel as a client | **Medium** | no code found; `BookingOut` only returns message |
| 10 | External dependencies (Unsplash, Google Fonts) and no offline fallback for fonts | **Medium** | `HomePage.tsx:10-23`, `index.css:1`, `ImageWithFallback.tsx:16` |
| 11 | Accessibility defects may fail basic WCAG checks | **Medium** | `Alert.tsx`, `AdminBookingsPanel.tsx:174`, `Stepper.tsx:25` |
| 12 | Custom `ValidationError` escaping Pydantic → HTTP 500 on ordinary bad input | **Critical** (correctness) | `core/errors.py:6,24-26` + `schemas/booking.py:21,23,52-53,60-61`, `schemas/admin.py:26,95,109,115,142,149,156,158,200` |

**Business-continuity note:** the live site has its own booking flow and policies. This demo has no code path, config or deployment artifact that touches it; keep it that way by never pointing `DATABASE_URL`/CORS at production assets.

---

## E. UI/UX assessment

**Strengths:** cohesive editorial design (cream/ink/lime, serif display type — `tailwind.config.js:5-22`); responsive grids and mobile nav (`Navbar.tsx:27-81`); consistent loading, error and empty states across pages; clear sample-data badges; explainable recommendation with override; 409 conflict is surfaced with refreshed slots (`BookingPage.tsx:217-224`); admin tabs and masked public data.

**Weaknesses / opportunities:**
1. No focus management, Escape-to-close or labelled dialog in booking detail modal (`AdminBookingsPanel.tsx:173-215`).
2. Alerts are not announced to screen readers (`Alert.tsx:19-29`) — no `role="alert"`/`aria-live`.
3. Availability can render stale data after rapid date changes (`useAvailability.ts:17-36`) — no abort signal or stale-response guard.
4. Step names disappear on mobile (`Stepper.tsx:25`), and progress has no `aria-current`.
5. Admin bookings table relies on horizontal scroll (`AdminBookingsPanel.tsx:140-169`) — no card layout on narrow screens.
6. "Rebook" is a generic link, not a true one-click return (`ConfirmationPage.tsx:93`, `LookupPage.tsx:131`).
7. Confirmation is session-local; refreshing works, opening on another device does not (`ConfirmationPage.tsx:8-18`).
8. Admin cannot edit service prices/durations or reschedule from the UI despite API support.
9. Only 14 bookable dates offered vs 60-day backend horizon (`BookingPage.tsx:63-66`).
10. Branding/contact are placeholders (`Footer.tsx:41-45`) and imagery is generic Unsplash.
11. No "demo terms" content despite checkbox-like copy (`BookingPage.tsx:337`).
12. No email confirmation expectations set explicitly on the booking screen.
13. `cardFor()` in `recommendation.ts:37-61` is dead code — all branches return an empty card.
14. README overstates frontend test coverage (`README.md:99` claims formatting and API-client tests that don't exist).

---

## F. Database and API assessment

**Models** (`models/__init__.py`): 7 tables — `services` (price/duration checks at 41-44), `clients` (unique email+phone at 51), `bookings` (unique reference, interval check, status check, index on `start_at/end_at/status` at 64-71), `working_hours` (unique weekday at 96), `blocked_dates` (unique date at 112), `admin_users`, `admin_sessions` (unique token hash, `revoked` flag at 131-143). FK enforcement and WAL enabled (`database.py:36-46`). No cascade deletes; no `ON DELETE` rules; no `deleted_at` columns. Timestamps stored as **strings**, not `DateTime` (`models/__init__.py:77-79,139`) — lexicographic comparisons work only because all values are normalised UTC ISO strings.

**Critical gaps:** no price/duration snapshot; no DB-level overlap constraint (correctness relies on application logic + process lock); no migrations (`create_all` never alters existing tables); Python-side defaults not server defaults; no DB validation of working-hour/blocked-time ordering (API-only).

**API:** 16 admin endpoints (all bearer-protected via `AdminDependency`, `routers/admin.py:46-65`), 5 public endpoints, health check (`main.py:76-78`), Swagger at `/docs`. Validation is generally good but has the `ValidationError`→500 defect. Errors use stable codes with custom handler (`main.py:51-73`, `core/errors.py:6-46`). OpenAPI under-reports error responses (401/404/409/429/500 not declared). Admin responses include full client email/phone by design; public responses mask them.

**Booking engine:** slot grid from working hours + lead time + horizon + closures + overlap exclusion (`services/availability.py:76-114`); creation under `BEGIN IMMEDIATE` and `RLock` with conflict → 409 (`services/booking.py:79-133`, `core/errors.py:29-31`). Single-process/multi-worker caveat documented. Half-open interval overlap logic is correct for tested cases. `Africa/Accra` has no DST, so timezone handling is low-risk here.

**Payments:** no deposit/payment/webhook/sandbox implementation — verified exhaustively. Only explicit "no payment" disclaimers. No provider SDKs, payment tables, or keys in any source/config/DB.

---

## G. Testing results

**Run in this audit:**

```
cd /home/chris_techzard/projects/mina-minks/backend && .venv/bin/python -m pytest -q -p no:cacheprovider
```

Result: `11 passed, 1 warning in 6.59s` (warning: Starlette `anyio.abc.BlockingPortal` deprecation). Safe: `tests/conftest.py:9-13` sets a unique temp SQLite URL before app import; the autouse fixture drops/recreates only that temp DB; `-p no:cacheprovider` avoided cache writes. Read-only DB counts confirmed the local `mina_minks.db` was unchanged.

**Test inventory (fully enumerated):**
- Backend 11 tests: 3 admin (`test_admin_api.py:12-113`), 5 collision/race (`test_booking_collisions.py:24-118`), 3 public API (`test_public_api.py:8-57`).
- Frontend 4 unit tests, all in `recommendation.test.ts:14-49`. No tests for `format.ts`, `api.ts`, hooks, pages, or components.
- Browser E2E: `browser-smoke.mjs` runs `python -m app.seed --reset` (lines 15-21), creates two bookings to exercise the 409 path, signs into admin and flips a status. **Destructive by design** — excluded from this audit.

**Historical results from earlier in this project (not re-run):** frontend `npm test` → 4 passed; `npm run build` → succeeded; `npm run test:e2e` → `BROWSER SMOKE TEST PASSED`.

**Command safety:**
| Command | Impact |
|---|---|
| `pytest -q` (with `-p no:cacheprovider`) | Safe — temp DB only; leaves an unlinked temp file and uses private `_events` for limiter reset |
| `npm test` | Read-only — pure in-memory function tests |
| `npm run build` | Writes `frontend/dist/` + `tsconfig.*.tsbuildinfo` |
| `npm run test:e2e` | **Destructive** — `drop_all` on whatever `DATABASE_URL` is inherited, then reseed |

**Missing coverage:** health endpoint, rate-limit assertions, multi-process races, session expiry/revocation, lookup by phone, malformed Reference, input-validation lengths, lead-time/horizon boundaries, partial-day closures, reschedule/reactivation validation, service edit fields beyond `is_active`, `GET /api/services/{id}`, dashboard sample value, frontend formatting/API-client unit tests, React component tests, CI configuration, payment regression tests.

---

## H. Prioritized improvement roadmap

**P0 — critical correctness, security, data integrity**
1. Make admin reschedule/reactivation use the same `BEGIN IMMEDIATE` + lock path as creation; add lead-time and status-transition validation (`services/admin.py:121-156`).
2. Snapshot `price_ghs`, `duration_minutes` (and service name) onto `Booking` at creation; use snapshot in all DTOs (`models/__init__.py:73-84`, `schemas/admin.py:42-79`, `services/booking.py:60-76`). Add migration path.
3. Fix `ValidationError` to inherit `ValueError` (or use `PydanticCustomError`) so validators return 422 instead of 500 (`core/errors.py:6,24-26`).
4. Replace env-rewrite-at-startup with a proper admin account model: no password in env after provisioning, rotation invalidates sessions immediately, HTTPS + HTTP-only cookies (`database.py:69-80`, `useAdminSession.ts`, `AdminLogin.tsx:79-82`).
5. Guard `reset_schema()` behind explicit dev-only checks and require `--confirm`; never allow drops outside `ENVIRONMENT=demo` (`database.py:83-93`, `seed.py:137-143`).
6. Strengthen phone validation (require digit count, Ghana-friendly normalisation) and re-normalise stored clients (`schemas/booking.py:13,56-62`).
7. Make rate limiting shared (Redis or DB-backed) and derive client IP from trusted proxy headers with allow-listed proxies (`core/rate_limit.py`, `routers/*`).

**P1 — essential customer and admin functionality**
8. Add Alembic migrations and a documented backup/restore procedure; add Dockerfile/compose + CI for independent deployment (never targeting live infra).
9. Build admin reschedule UI and service price/duration editing UI (`AdminBookingsPanel.tsx`, `AdminSettingsPanel.tsx`).
10. Align booking horizon (surface all 60 days or make frontend configurable) (`BookingPage.tsx:63-66`, `config.py:29`).
11. Real rebooking: prefill service/date from a past booking; make confirmation retrievable by API rather than sessionStorage-only.
12. Email/SMS confirmation and cancellation notices; client-side cancel/reschedule with verification.
13. Hide inactive services from all public endpoints (`routers/services.py:29-31`); add status state machine and audit log.

**P2 — UI/UX and product quality**
14. Accessibility: `role="alert"`/`aria-live`, modal focus trap + Escape, `aria-current` in stepper, visible step labels on mobile.
15. Stale-request guard in `useAvailability.ts`; optimistic refresh on returning to the time step.
16. Replace placeholder branding/contact/imagery with Mina-approved assets; add published policies/FAQs (read-only reference from live site, not copied automatically).
17. Add demo terms content and explicit acceptance; tighten confirmation expectations.
18. Remove dead `cardFor()` branches; self-host fonts or add robust local font fallback.

**P3 — future enhancements**
19. Payment/deposit design: choose provider, sandbox, payment states, webhooks with signature verification, refund handling — business decision first.
20. Multi-admin roles, customer accounts, per-client capacity/buffer rules, reporting/export.
21. Monitoring, structured logging, alerting, load testing with multiple workers.

---

## I. Recommended next implementation task

**First task: make admin reschedule/reactivation atomic and add price/duration snapshots (P0 items 1–2), together as one schema+service change.**

Why it comes first: creation is already race-safe and tested, but the admin path can still create overlapping active appointments (`services/admin.py:121-156` lacks the lock/transaction). At the same time, every booking reads price and duration from the live service row (`schemas/admin.py:77-78`), so a routine admin edit retroactively rewrites historic appointments and confirmations. These are the only two gaps that can silently corrupt the core business record — availability integrity and booking value — and both are cheap to fix now before any data worth preserving exists. Everything else is additive and can follow safely once the data model is trustworthy.

---

## Addendum — deployment & testing detail (arrived after main report)

**Deployment/CI artifacts — absent:** no Dockerfile, docker-compose, nginx/Caddy, `.github/`, CI YAML, Makefile, shell scripts, systemd units, Alembic, or backup/restore tooling. No git commits or remote — repo entirely untracked. Backend serves **no static files** and has no SPA history fallback — deep links (`/booking/:reference`, `/admin`) would 404 on a naive static host. Live deployment requires setting both `FRONTEND_ORIGIN` (CORS) and rebuilding `VITE_API_URL`; defaults are localhost-only.

**Environment variables:** Backend — `ENVIRONMENT`, `DATABASE_URL`, `FRONTEND_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_TTL_MINUTES`, `SLOT_INCREMENT_MINUTES`, `BOOKING_LEAD_TIME_MINUTES`, `BOOKING_HORIZON_DAYS`, `BUSINESS_TIMEZONE`, `MAX_LOGIN_ATTEMPTS_PER_MINUTE`, `MAX_BOOKING_REQUESTS_PER_MINUTE`. Frontend — `VITE_API_URL`. E2E — `E2E_WEB_URL`, `CHROME_PATH`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. No `.env` files exist (only `.env.example`); no payment keys or `SECRET_KEY`.

**Documentation corrections:** README's reported layout is wrong (`models.py` vs `models/__init__.py`, `scripts/` under `src/`, nonexistent auth service); frontend test coverage overstated; destructiveness of `--reset` understated; admin password overwrite behavior undocumented; no deployment documentation at all.

**Top interference risks to the live site (ranked):**
1. `npm run test:e2e` / `--reset` with an inherited `DATABASE_URL` → irreversible `drop_all` of any target DB; no backups exist.
2. Every app startup runs `init_db()` + `seed_if_empty()`; `init_db()` **overwrites the admin password hash** from `ADMIN_PASSWORD` (`database.py:69-80`).
3. Default admin credentials `mina@example.com` / `demo-password-change-me` work out of the box.
4. CORS/API origin mismatch — defaults are localhost-only; a live deployment fails all API calls without exact config and rebuild.
5. No HTTPS enforcement, security headers, or production config; `ENVIRONMENT` only changes the health response.
6. WAL sidecars exist — copying only `mina_minks.db` without checkpointing yields inconsistent backups.

**Note:** no occurrence of `minaminks.com` anywhere in source, docs, config, git config, or local DB strings. No hard-coded live-domain pointer.

---

*All work should stay in this independent repo/environment. No commands in the audit modified files, databases, dependencies, or the live Mina Minks website.*
