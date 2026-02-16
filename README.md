# ClientPulse

AI-powered real estate client management system. Enter client data once, get intelligent matching, automated follow-ups, and AI-generated insights.

## Quick Start

```bash
# 1. Copy fonts from CompAtlas
cp -r ../comp-atlas/src/app/fonts src/app/

# 2. Install dependencies
bun install

# 3. Start dev server (port 3003)
bun dev
```

Opens at `http://localhost:3003` with 10 sample clients and mock data.

## Features

### Dashboard
- **Today's Actions** - Priority-sorted tasks from triggers and AI recommendations
- **Property Matches** - New MLS listings scored against client preferences
- **Client Pipeline** - Kanban view by lifecycle stage
- **Recent Activity** - Timeline of all client interactions

### Client Management
- **Single Intake Form** - 4-step wizard: Contact → Type → Preferences → Situation
- **Dynamic Preferences** - Rental clients see lease/pet/amenity fields; buyers see pre-approval/lender fields
- **AI Profiles** - Claude API generates summaries and next-action recommendations
- **Activity Timeline** - Every call, showing, email, and system event logged
- **Transaction History** - Completed leases and sales linked to profiles

### Automation (Phase 3)
- Lease expiration alerts (90/60/30/14 days)
- Post-showing follow-ups (24hr)
- New listing matching (every 15-30 min)
- Quarterly touch-base scheduling
- Draft message generation

## Architecture

```
Port 3001 → CompAtlas (Sales Comps)
Port 3002 → RentAtlas (Rental Comps)
Port 3003 → ClientPulse (Client Management)
```

All three share the same RETS/MLS connection and design system.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    page.tsx              # Dashboard
    clients/page.tsx      # Client list + intake form
    clients/[id]/page.tsx # Client detail profile
  components/
    dashboard/            # Stats, Actions, Pipeline, Matches, Activity
    clients/              # List, Detail, IntakeForm, AIProfileCard
    layout/               # Header
  services/
    mock-service.ts       # Mock data (swap for Supabase service)
  types/
    client.ts             # All TypeScript types
  data/
    mock-data.json        # 10 sample clients with full profiles
  lib/
    utils.ts              # Formatting, scoring, styling utilities
```

## Build Phases

- **Phase 1** (Current): Client database, intake form, profiles, activity logging
- **Phase 2**: Claude API integration, MLS sync, property matching engine
- **Phase 3**: Trigger engine, automated follow-ups, draft messages
- **Phase 4**: Agent dashboard polish, mobile responsive, team features

## Swapping to Supabase

1. Set up Supabase project
2. Run schema migrations (tables: clients, client_preferences, client_activity, transactions, property_matches, triggers, ai_profiles)
3. Create `src/services/supabase-service.ts` matching the same interface as `mock-service.ts`
4. Update imports in page components
5. Set `NEXT_PUBLIC_DATA_SOURCE=supabase` in `.env.local`
