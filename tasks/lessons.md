# Lessons Learned

- [2026-03-08] [ClientPulse] OAuth token validation: Always validate that access_token and refresh_token are present after OAuth exchange — don't silently default to empty strings, throw explicitly so failures are caught early
- [2026-03-08] [ClientPulse] Service layer parity: When adding new DB operations, always update all 3 files (mock-service, supabase-service, index.ts) together — easy to forget the re-export in index.ts
- [2026-03-08] [ClientPulse] Vercel domain is `client-pulse-livid.vercel.app` — NOT mccannrealtors.vercel.app (that's the listings API)

