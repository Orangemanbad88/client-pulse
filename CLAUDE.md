# CLAUDE.md - ClientPulse

## Project Overview
AI CRM for real estate agents. Dark navy/charcoal + gold/amber design on warm cream background.
Path: C:\Users\tmcca\client-pulse
Dev server: port 3003
Deployed on Vercel

## Stack
- Next.js 14.1.0 (App Router), TypeScript strict, Tailwind CSS
- Supabase (auth, DB, RLS) via @supabase/ssr
- Google Calendar OAuth via googleapis
- Email via Resend
- Validation: zod 3.24.2
- Utilities: clsx + tailwind-merge
- Icons: lucide-react
- No component library (custom UI in src/components/ui)

## Data Layer
- Service router: src/services/index.ts — toggled by NEXT_PUBLIC_DATA_SOURCE env var
- Two implementations: mock-service.ts (local JSON) and supabase-service.ts
- **Parity rule**: any new DB operation MUST be added to both mock-service and supabase-service + re-exported from index.ts
- Case conversion: src/lib/case-utils.ts handles snake_case (DB) <-> camelCase (app)

## Supabase Schema (7 tables)
- **clients** — core entity (name, email, phone, type, status, lifecycle_stage, source, assigned_agent)
- **client_preferences** — rental/buyer prefs as JSONB, FK to clients
- **activities** — client activity log (type, title, description, property_address)
- **transactions** — deals (property, type, amount, lease_end_date)
- **property_matches** — generated matches (listing, match_score, match_reasons[], status)
- **ai_profiles** — AI summaries + next_actions JSONB, one per client
- **triggers** — automated actions (type, fire_date, status, urgency, message_draft)
- All tables have RLS enabled. Policies: service role full access, anon read-only
- Auto-updated_at triggers on: clients, client_preferences, triggers
- Migrations: supabase/migrations/ with sequential numbering (001_ exists)

## API Routes
- POST /api/matches/generate — takes clientId, fetches listings, scores via matching.ts, inserts top 10
- PUT/DELETE /api/clients/[id] — edit and delete client
- POST /api/calendar/sync — Google Calendar sync
- GET /api/listings — intentionally public, no auth required

## Key Modules
- **Matching engine**: src/lib/matching.ts — scores: budget 40pts, beds 20pts, location 20pts, type 10pts, baths 10pts
- **Trigger evaluator**: src/lib/trigger-evaluator.ts — automation trigger logic
- **Google Calendar**: src/lib/google-calendar.ts — lazy env validation, fails fast with clear error
- **Email**: src/lib/email.ts + Resend SDK

## Env Vars Required
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_DATA_SOURCE (mock | supabase)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- RESEND_API_KEY

## Design System
- Sidebar/headers: dark navy/charcoal
- Accent: gold/amber (numbers, badges, active states, charts, accent bars)
- Background: warm cream/beige
- Cards: white with subtle borders
- Section headers: dark navy bg with gold left-border accent
- Premium page headers: icon containers, sticky positioning, gradient styling
- Follow existing color tokens — don't introduce new colors

## Current Status
- Supabase schema written but **pending real credentials** — still on mock data
- Mock/Supabase service parity complete (13 functions + deleteClient + bulkInsertMatches)
- Production hardening done: next/image, env validation, error UIs, no console.logs client-side
- Client matchmaking, edit/delete, premium headers all complete
- Build passes clean — zero errors, zero warnings

## Routes
- / — Dashboard (KPI cards, Today's Actions, Client Overview donut, Property Matches)
- /analytics — Analytics
- /calendar — Calendar (Google Calendar integration)
- /clients — Client management (with edit/delete modals)
- /clients/[id] — Client detail (Edit, Delete, Find Matches buttons)
- /comp-atlas — Comp atlas (TOOLS section)
- /email — Email compose with templates
- /messages — Messages
- /properties — Properties (uses next/image, remote patterns configured)
- /rent-atlas — Rental comp search (TOOLS section)

## Sidebar Navigation
- MAIN: Dashboard, Clients, Properties, Calendar, Messages, Email, Analytics
- TOOLS: CompAtlas, RentAtlas
- Bottom: Settings, Dark Mode toggle

## Project-Specific Rules
- Google Calendar OAuth tokens: never log, never commit
- CSV import: validate all columns server-side before DB write
- Email templates: keep centralized, not inline in components
- Calendar views: test with 30+ events for rendering perf
- /api/listings is intentionally public — don't add auth
- Remote image patterns configured for realtimerental.com + comp-search.vercel.app

## Future Considerations
- Client criteria -> auto-matching alerts from cape-may-scraper
- Rental comp integration shares Supabase with rental-comp-search
- Still need to: create Supabase project, add real creds, run migrations, run seed, deploy
