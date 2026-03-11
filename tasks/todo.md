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

## Client Matchmaking, Edit/Delete, Premium Headers (Completed)

- [x] Matching algorithm (`src/lib/matching.ts`) — scores listings against client prefs (budget 40pts, beds 20pts, location 20pts, type 10pts, baths 10pts)
- [x] Match generation API (`/api/matches/generate`) — POST with clientId, fetches listings, runs algorithm, inserts top 10 matches
- [x] Client edit/delete API (`/api/clients/[id]`) — PUT + DELETE handlers
- [x] Service layer — added `deleteClient` + `bulkInsertMatches` to supabase-service, mock-service, index.ts
- [x] EditClientModal component — form modal with all client fields, teal/amber design
- [x] ClientDetail wiring — Edit button opens modal, Delete with confirmation, Find Matches button (visible when prefs exist)
- [x] Premium page headers — all 6 pages upgraded with icon containers, sticky positioning, gradient styling
- [x] Build passes clean — zero errors

### Files Changed (Matchmaking + Edit/Delete + Headers)
- `src/lib/matching.ts` — NEW
- `src/app/api/matches/generate/route.ts` — NEW
- `src/app/api/clients/[id]/route.ts` — NEW
- `src/components/clients/EditClientModal.tsx` — NEW
- `src/components/clients/ClientDetail.tsx` — Edit/Delete/FindMatches buttons, modals, useRouter
- `src/services/supabase-service.ts` — added deleteClient, bulkInsertMatches
- `src/services/mock-service.ts` — added deleteClient, bulkInsertMatches
- `src/services/index.ts` — added deleteClient, bulkInsertMatches exports
- `src/app/clients/page.tsx` — premium header
- `src/app/calendar/page.tsx` — premium header
- `src/app/messages/page.tsx` — premium header
- `src/app/email/page.tsx` — premium header
- `src/app/analytics/page.tsx` — premium header
- `src/app/properties/page.tsx` — premium header

## Gmail + Outlook OAuth Email Integration (Completed)

- [x] Database migration `004_email_accounts.sql` — email_accounts table with RLS
- [x] `EmailAccount` type in `src/types/client.ts`
- [x] Service layer — 5 new functions (getEmailAccounts, getEmailAccount, upsertEmailAccount, deleteEmailAccount, updateEmailTokens) in mock-service, supabase-service, and index.ts
- [x] `src/lib/gmail.ts` — Gmail OAuth + send via Gmail API (reuses googleapis package)
- [x] `src/lib/outlook.ts` — Outlook OAuth + send via Microsoft Graph API (plain fetch, no MSAL)
- [x] `src/lib/email.ts` — Updated sendEmail to check connected accounts first, fallback to Resend
- [x] API routes — gmail/connect, gmail/callback, outlook/connect, outlook/callback, email/accounts
- [x] Settings page — Gmail/Outlook connect/disconnect buttons with status badges
- [x] Email compose — "Sending as" label shows connected account or Resend fallback
- [x] Build passes clean — zero errors, zero warnings

### REMINDER: Test Gmail OAuth flow
- Added redirect URI to Google Console? If not, do that first
- Then: `bun dev` → `/settings` → Connect Gmail → sign in → verify connected
- Then: `/email` → Compose → verify "Sending as" label

### Pending — User Action Required (Email OAuth)
- [ ] Add `gmail.send` + `userinfo.email` scopes in Google Cloud Console OAuth consent screen (required before publishing/verification — not blocking local dev but MUST do before going live)
- [x] Enable Gmail API in Google Cloud Console
- [ ] Set `GOOGLE_GMAIL_REDIRECT_URI=http://localhost:3003/api/auth/gmail/callback` in `.env.local`
- [ ] Add production redirect URI in Google Console: `https://client-pulse-livid.vercel.app/api/auth/gmail/callback`
- [ ] Set `GOOGLE_GMAIL_REDIRECT_URI=https://client-pulse-livid.vercel.app/api/auth/gmail/callback` in Vercel env vars
- [ ] Register app in Azure Portal (Microsoft Entra ID) for Outlook OAuth
- [ ] Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` in `.env.local`
- [ ] Test: Settings → Connect Gmail → OAuth flow → verify connected email shows
- [ ] Test: Settings → Connect Outlook → OAuth flow → verify connected email shows
- [ ] Test: Compose email → verify "Sending as" shows connected account
- [ ] Test: Disconnect → verify fallback to Resend

### Files Changed (Email OAuth Integration)
- `supabase/migrations/004_email_accounts.sql` — NEW
- `src/types/client.ts` — added EmailAccount interface
- `src/services/mock-service.ts` — 5 email account functions
- `src/services/supabase-service.ts` — 5 email account functions
- `src/services/index.ts` — 5 email account re-exports
- `src/lib/gmail.ts` — NEW
- `src/lib/outlook.ts` — NEW
- `src/lib/email.ts` — MODIFIED (OAuth-first, Resend fallback)
- `src/app/api/auth/gmail/connect/route.ts` — NEW
- `src/app/api/auth/gmail/callback/route.ts` — NEW
- `src/app/api/auth/outlook/connect/route.ts` — NEW
- `src/app/api/auth/outlook/callback/route.ts` — NEW
- `src/app/api/email/accounts/route.ts` — NEW
- `src/app/settings/page.tsx` — MODIFIED (Gmail/Outlook connect/disconnect UI)
- `src/app/email/page.tsx` — MODIFIED ("Sending as" label)

## Email Full Sync: Gmail + Outlook Read/Reply (Completed)

- [x] Added `EmailParticipant`, `EmailMessage`, `EmailThread`, `ReplyEmailInput` types to `src/types/client.ts`
- [x] Added `gmail.readonly` scope to Gmail OAuth, `Mail.Read` scope to Outlook OAuth
- [x] Gmail read/reply: `fetchGmailMessages()`, `parseGmailMessage()`, `replyGmailEmail()` in `src/lib/gmail.ts`
- [x] Outlook read/reply: `fetchOutlookMessages()`, `parseOutlookMessage()`, `replyOutlookEmail()` in `src/lib/outlook.ts`
- [x] Dispatcher functions: `ensureValidToken()`, `fetchInboxMessages()`, `groupIntoThreads()`, `replyToEmail()` in `src/lib/email.ts`
- [x] Refactored `sendEmail()` to use `ensureValidToken()` (DRY)
- [x] Created `GET /api/email/inbox` — fetches client-filtered inbox threads on demand
- [x] Created `POST /api/email/reply` — sends threaded replies with zod validation
- [x] Updated email page: inbox folder, thread conversation view, inline reply box, loading skeletons
- [x] Header injection protection: `sanitizeHeader()` strips CR/LF from MIME headers
- [x] Build passes clean — zero errors, zero warnings

### Pending — User Action Required (Email Sync)
- [ ] Users must reconnect Gmail/Outlook in Settings after deploy (new read scopes require re-consent)
- [ ] Add `gmail.readonly` scope to Google Cloud Console OAuth consent screen
- [ ] Add `Mail.Read` permission in Azure Portal app registration
- [ ] Test: Email page → Inbox tab loads with client-filtered threads
- [ ] Test: Click thread → see full conversation → reply → verify threaded in Gmail/Outlook

### Files Changed (Email Full Sync)
- `src/types/client.ts` — added email inbox types
- `src/lib/gmail.ts` — added read scope, fetchGmailMessages, parseGmailMessage, replyGmailEmail, sanitizeHeader
- `src/lib/outlook.ts` — added read scope, fetchOutlookMessages, parseOutlookMessage, replyOutlookEmail
- `src/lib/email.ts` — added ensureValidToken, fetchInboxMessages, groupIntoThreads, replyToEmail; refactored sendEmail
- `src/app/api/email/inbox/route.ts` — NEW
- `src/app/api/email/reply/route.ts` — NEW
- `src/app/email/page.tsx` — REWRITTEN (inbox + sent + reply)

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
