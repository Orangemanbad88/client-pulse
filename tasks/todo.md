# ClientPulse — Supabase Foundation

## Status: Code complete, awaiting Supabase credentials

### Completed
- [x] Install `@supabase/supabase-js` + `@supabase/ssr`
- [x] Create schema SQL (`supabase/migrations/001_initial_schema.sql`) — 7 tables, indexes, RLS, triggers
- [x] Create seed SQL (`supabase/seed.sql`) — all mock data with deterministic UUIDs
- [x] Create `src/lib/supabase.ts` — server + browser client factories
- [x] Create `src/lib/case-utils.ts` — snake_case ↔ camelCase key transformers
- [x] Create `src/services/supabase-service.ts` — all 13 functions matching mock-service signatures
- [x] Create `src/services/index.ts` — service router (env var toggle)
- [x] Update all 8 consumer files to import from `@/services` instead of `@/services/mock-service`
- [x] Create `.env.local` with placeholder Supabase credentials
- [x] Verify clean build (`bun run build` passes)

### Pending — User Action Required
- [ ] Create Supabase project at supabase.com
- [ ] Add real credentials to `.env.local`
- [ ] Run `001_initial_schema.sql` in Supabase SQL Editor
- [ ] Run `seed.sql` in Supabase SQL Editor
- [ ] Set `NEXT_PUBLIC_DATA_SOURCE=supabase` in `.env.local` and test
- [ ] Add env vars to Vercel dashboard
- [ ] Deploy to Vercel and verify

## Production Hardening (Completed)

- [x] Replace raw `<img>` with `next/image` in properties page + configure remotePatterns
- [x] Add env var validation for Google OAuth (fails fast with clear error)
- [x] Remove all `console.error` from client-side code (kept in API routes)
- [x] Add error UI to all pages (calendar, messages, clients, email, dashboard)
- [x] Document `/api/listings` as intentionally public
- [x] Build passes clean — zero errors, zero warnings

### Files Changed (Production Hardening)
- `next.config.mjs` — added `images.remotePatterns` for realtimerental.com + comp-search.vercel.app
- `src/app/properties/page.tsx` — `next/image`, error fallback placeholders, removed console.error
- `src/lib/google-calendar.ts` — lazy env validation with clear error message
- `src/components/layout/ClientShell.tsx` — removed console.error
- `src/app/clients/page.tsx` — added error state UI, removed console.error
- `src/app/page.tsx` — added error state UI, removed console.error
- `src/app/messages/page.tsx` — added error state UI, removed console.error
- `src/app/calendar/page.tsx` — added error state UI, removed console.error
- `src/app/analytics/page.tsx` — removed console.error
- `src/app/email/page.tsx` — added error state UI, removed console.error
- `src/app/api/listings/route.ts` — documented as intentionally public

### Files Changed (Supabase Foundation)
- `package.json` — added supabase deps
- `src/lib/supabase.ts` — NEW
- `src/lib/case-utils.ts` — NEW
- `src/services/supabase-service.ts` — NEW
- `src/services/index.ts` — NEW (service router)
- `src/app/clients/page.tsx` — import change
- `src/app/clients/[id]/page.tsx` — import change
- `src/app/email/page.tsx` — import change
- `src/app/calendar/page.tsx` — import change
- `src/app/analytics/page.tsx` — import change
- `src/app/api/calendar/sync/route.ts` — import change
- `src/components/layout/ClientShell.tsx` — import change
- `src/app/messages/page.tsx` — import change
- `supabase/migrations/001_initial_schema.sql` — NEW
- `supabase/seed.sql` — NEW
- `.env.local` — NEW (gitignored)
