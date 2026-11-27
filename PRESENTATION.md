# Mina Minks booking demo — guide and explanation

## Links

| What | Link | Status |
| --- | --- | --- |
| **Public demo (Mina's side)** | https://mina-minks-demo-web-1xa7.onrender.com | Live |
| Backend health check | https://mina-minks-demo-api-1xa7.onrender.com/api/health | Live (`{"status":"ok"}`) |
| Private source repository | https://github.com/ChrisTechzard/mina-minks-demo | Private |
| GitHub Pages fallback | https://chrisTechzard.github.io/mina-minks-demo/ | Pending activation (returns 404 until enabled) |

The demo site is **independent** of the live business website. Nothing on
`minaminks.com`, its domain, hosting, private admin, production database or APIs was
changed.

## What is real, what is sample, what needs approval

**Verified public information** (from `minaminks.com`, checked 27 Nov 2026):
business name, founder **Beryl Addo**, tagline, phone `+233 50 529 8278`, email
`minaminks01@gmail.com`, WhatsApp, Instagram `@mina.minkss`, Snapchat, map link,
Accra/Ghana, and eight published menu items with prices and durations.

**Sample/demo information:** all bookable slots, working hours, policies,
availability, confirmation references, aftercare wording, admin settings and seeded
records. Public prices and durations appear in a clearly labelled **read-only**
reference section; they are **not enforced** by the demo booking engine.

**Pending Mina's approval:** the provided studio photograph (shown with a pending
caption), final photography, any policy or price used as a real booking rule, admin
credentials, and any decision to accept real bookings.

## How it works

1. **Home** — brand introduction, verified public contact links, sample service preview.
2. **Services** — the sample bookable menu plus the labelled public menu reference.
3. **Style finder** — a short recommendation quiz using sample rules.
4. **Book** — choose a service, date and time. Available slots come from the API in
   `Africa/Accra` time, in 30-minute increments, with lead-time and horizon rules.
   The backend prevents two bookings taking the same slot.
5. **Confirmation** — shown only after a **real successful API response**. The
   reference and details are saved in the browser session; no email, payment or
   notification is sent.
6. **Find a booking** — look up a demo booking by reference plus email/phone; contact
   details are masked.
7. **Aftercare** — content loaded from the API.
8. **Staff area** — private sign-in for demo administration of bookings, services,
   working hours and closed dates. The password lives only in Render's environment
   settings, never in the repository.

If the API is unavailable, the pages show explicit errors such as "Menu unavailable"
or "Booking not submitted". The app never invents a successful booking.

## Technical shape

- **Frontend:** React + Vite + Tailwind, built as a static site.
- **Backend:** FastAPI + SQLAlchemy. SQLite locally; PostgreSQL on Render.
- **Migrations:** additive and dialect-aware, so SQLite and PostgreSQL use the
  correct boolean defaults/literals.
- **Security:** PBKDF2 password hashing, hashed expiring bearer tokens, rate limits,
  CORS restricted to the real frontend hostname. No secrets or customer records are
  committed.
- **Hosting:** free Render static site, free Render web service and free Render
  Postgres, defined in `render.yaml`.

### Free-tier limitations to mention

Render free web services spin down after ~15 minutes idle, so the first request can
take about a minute. Free Render Postgres expires 30 days after creation. The GitHub
Pages fallback is a static presentation only and still needs activation; on a free
personal GitHub account it requires making the repository public, while Pro/Team can
keep it private.

## Explanation you can use

> "This is an independent presentation prototype for Mina Minks, not a replacement
> for the live website. It lets a client explore the brand, compare a sample menu,
> find a style and reserve a demo slot. The public business details and published
> menu come from the real site and are shown as reference, while every bookable
> price, time and policy is clearly labelled as sample data. A booking only appears
> as confirmed when the backend actually accepts it — nothing is faked, and no
> payment, email or notification is sent. The private staff area can manage the
> demo bookings and settings. It runs on free infrastructure purely to demonstrate
> the experience, and Mina's approval is still needed before anything here becomes
> a real booking rule or goes live for customers."

## Suggested talking points

- The customer journey is complete: discover → compare → choose → book → find again → aftercare.
- Every screen states that this is a demo; public prices are reference only.
- No live business data, domain, admin or database was touched.
- One click takes you to the demo; the backend health link proves the service is really running.
