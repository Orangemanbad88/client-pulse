# CLAUDE.md - client-pulse

## What This Is
AI CRM for real estate agents. Helps agents manage contacts, track listing activity, and stay on top of follow-ups. Teal/amber design system with backdrop-blur cards.

## Stack
- Next.js (App Router), TypeScript strict, Tailwind CSS
- Supabase (auth + database)
- Vercel (deployment)
- shadcn/ui components

## Features Built
- CSV import for contacts
- Monthly calendar grid with Google Calendar sync
- Email compose with templates
- Source/freshness/deduplication logic for scraped listings
- Teal/amber design system

## Active Work
- Integrations in progress — check `tasks/todo.md` for current state

## Potential Integration
- rental-comp-search (rent-atlas) — client-property matchmaking discussed as future feature
- When implementing: pull from Supabase `rentals` table, match against client criteria

## Design System
- Primary: teal
- Accent: amber
- Cards: backdrop-blur style
- Keep all new UI consistent with this — don't introduce new color schemes

## Gotchas
- CSV import has deduplication logic — don't bypass it when adding new import sources
- Google Calendar sync is sensitive — test thoroughly before any changes to calendar logic
- Always validate contact data server-side before DB writes
