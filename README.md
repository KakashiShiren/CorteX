# Cortex

Cortex is a Next.js 14 campus utility app for Clark University students. It includes:

- A public landing page and auth flow
- Protected dashboard, people search, student profiles, campus map, AI chat, messages, and settings
- Next.js route handlers that cover the core backend spec
- Supabase SQL migrations and seed data
- Demo mode fallback so the app works before real keys are added

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS
- Zustand + TanStack Query
- Leaflet + OpenStreetMap
- Supabase-ready schema and helpers
- Groq-ready AI adapter with local fallback

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

## Demo Mode

If Supabase keys are missing, Cortex runs in demo mode with seeded Clark-like data and local cookie sessions.

Demo sign-in credentials:

- `maya@clarku.edu`
- `Password123`

## Live Mode Inputs Needed

To switch from demo mode to live data, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional, defaults to `llama-3.3-70b-versatile`)

Useful next production inputs from you:

- Official Clark building links, hours, and facility details
- Approved campus map coordinates or exported building dataset
- Branding assets or visual guidelines
- Final auth callback URL for Supabase email verification
- Any university FAQ pages or student-services links you want loaded into the knowledge base

## Supabase

Run the SQL files in [`supabase/migrations`](/M:/Projects/CorteX/supabase/migrations) in order:

1. `001_initial_schema.sql`
2. `002_seed_campus.sql`

## Notes

- Route handlers currently use a shared in-memory repository for demo mode.
- Supabase realtime hooks are scaffolded for status and conversation subscriptions when environment variables are present.
- Password change and destructive account deletion UI are present, but the production removal flow still needs to be connected to live Supabase auth/admin operations.
