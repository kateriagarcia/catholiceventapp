# Catholic Parish Event Finder

Search and browse Catholic parish events — feast days, adoration hours, fish
fries, novenas, retreats, and festivals — by location, date, and audience.

Built as a long-term hold with low ongoing maintenance in mind: a small
Node/Express API over SQLite, and a React frontend with no heavy framework
dependencies.

## Tech stack

- **Frontend:** React 19 (Vite), React Router
- **Backend:** Node.js / Express
- **Database:** SQLite (`better-sqlite3`) — schema is written to port cleanly
  to Postgres later (see `server/db/schema.sql`)
- **Payments:** Stripe Checkout + webhooks for self-serve sponsor
  subscriptions

## Project layout

```
server/   Express API, SQLite schema/migrations/seed, cron job, Stripe routes
client/   React app (Vite)
```

## Getting started

```bash
npm run install:all       # installs root, server, and client dependencies

cp server/.env.example server/.env
cp client/.env.example client/.env

npm run db:migrate        # creates server/data/app.db from schema.sql
npm run db:seed           # seeds ~30 real Rhode Island parishes + events

npm run dev                # runs API (port 4000) and client (port 5173)
```

Then open http://localhost:5173.

Admin dashboard: http://localhost:5173/admin — credentials come from
`ADMIN_USERNAME` / `ADMIN_PASSWORD` in `server/.env` (defaults to
`admin` / `change-me-please`; **change this before deploying**).

## Environment variables

**`server/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Single hardcoded admin login (v1 — no user accounts yet) |
| `STRIPE_SECRET_KEY` | Enables the sponsor self-serve checkout/portal when set |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhook signatures |
| `STRIPE_PRICE_STANDARD` / `STRIPE_PRICE_FEATURED` | Stripe Price IDs for each sponsor tier |
| `CLIENT_SUCCESS_URL` / `CLIENT_CANCEL_URL` | Where Stripe Checkout redirects after payment |

**`client/.env`**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API (e.g. `http://localhost:4000/api`) |

Without Stripe keys configured, the app still runs fine — the sponsor
checkout endpoint just returns a 503 until you add keys.

## Data model

See `server/db/schema.sql`. Five tables: `dioceses`, `parishes`, `events`,
`sponsors`, `submissions` (public event submissions land here, not directly
in `events`, until an admin approves them).

## Core features

- **Home** — search bar (keyword/location, date range, audience), "use my
  location" geolocation search, upcoming events, featured sponsor banner
- **Browse** — filters for diocese/category/date range/audience tags, list
  and map views (OpenStreetMap via Leaflet)
- **Event detail** — full info, parish contact, `.ics` "Add to Calendar"
  export, sponsor sidebar
- **Diocese page** (`/dioceses/:id`) — all upcoming events across the
  diocese, filterable by parish
- **Parish page** (`/parishes/:id`) — one parish's events, contact info,
  verified badge
- **Submit Event** (`/submit`) — public form with honeypot spam protection;
  writes to `submissions`, not `events`
- **Admin dashboard** (`/admin`) — approve/reject submissions, manage
  sponsors, manually add/edit parishes, dioceses, and events

## Automation

- An hourly cron job (`server/jobs/archiveEvents.js`) sets `is_active = 0`
  on events once their end time (or start time, if no end time was given)
  has passed. It also runs once on server startup.
- Submission spam protection is a honeypot field (`website_url`) — bots that
  autofill every input trip it and get a silent success response instead of
  a signal to retry.

## Sponsor portal (Stripe)

`POST /api/stripe/checkout-session` creates a subscription Checkout session
for a sponsor tier (`standard` or `featured`). `POST /api/stripe/webhook`
handles `checkout.session.completed` (creates the `sponsors` row) and
`customer.subscription.updated`/`deleted` (keeps `status` in sync) — so
sponsor accounts need no manual management once Stripe is configured. To
enable it:

1. Create two recurring Prices in Stripe (Standard, Featured).
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STANDARD`, `STRIPE_PRICE_FEATURED`.
3. Point a Stripe webhook at `POST /api/stripe/webhook` and set
   `STRIPE_WEBHOOK_SECRET` to its signing secret.

## Seed data

`server/db/seed.js` seeds the Diocese of Providence (Rhode Island) with ~30
real, well-known parishes and a realistic spread of events, so the app
never launches empty. **Addresses, phone numbers, and coordinates are
best-effort approximations** — this environment has no live web access to
scrape the current authoritative directory. Before public launch, verify
each parish's details against the Diocese of Providence Parish Finder
(dioceseofprovidence.org/parishfinder) and correct any of it from the admin
dashboard.

## Deployment

Deploys as a standard two-service app — API + static frontend — a good fit
for Vercel, Railway, or Render. Point `client`'s `VITE_API_URL` at the
deployed API URL, and `server`'s `CLIENT_ORIGIN` at the deployed frontend
URL. SQLite works fine for a single-instance deployment; if you outgrow it,
swap `better-sqlite3` for a Postgres client — the schema was written to
port over directly (see the note at the top of `schema.sql`).

### Deploying to Render (free tier)

`render.yaml` at the repo root defines both services as a Blueprint — Render
reads it automatically when you create a Blueprint from this repo, so you
don't have to configure build/start commands by hand.

**Free-tier tradeoff:** the API service has no persistent disk, so its
SQLite database resets on every cold start (the service spins down after 15
minutes idle). `startCommand` re-runs migrate + seed on every startup so the
app always comes back up with the base seed data — but anything added after
launch (approved submissions, sponsors, manually-added events) won't survive
a restart. Fine for demoing; upgrade the API service to a paid plan with a
disk once you want data to stick.

1. Push this repo to GitHub (already done) and go to
   [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**,
   then connect this repo. Render will detect `render.yaml` and propose both
   services.
2. It'll prompt for the `sync: false` variables before deploying:
   - `ADMIN_PASSWORD` — pick something other than the example default.
   - `CLIENT_ORIGIN`, `VITE_API_URL` — leave blank for now, see step 3.
   - The `STRIPE_*` vars — leave blank unless you're enabling sponsor checkout now.
3. Deploy. Render assigns each service a URL like
   `https://parish-event-finder-api.onrender.com` and
   `https://parish-event-finder-client.onrender.com`. Once both are up, go to
   each service's **Environment** tab and fill in the other's URL:
   - On the API service, set `CLIENT_ORIGIN` to the client's URL.
   - On the static site, set `VITE_API_URL` to the API's URL **+ `/api`**
     (e.g. `https://parish-event-finder-api.onrender.com/api`).
   Saving an env var triggers a redeploy of that service automatically.
4. Open the client URL — that's your live site.
