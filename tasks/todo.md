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

### Files Changed
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
