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
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CANVAS_CLARK_CLIENT_ID`
- `CANVAS_CLARK_CLIENT_SECRET`
- `CANVAS_NEU_CLIENT_ID`
- `CANVAS_NEU_CLIENT_SECRET`
- `CANVAS_WPI_CLIENT_ID`
- `CANVAS_WPI_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME` (optional, defaults to `Cortex`)
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional, defaults to `llama-3.3-70b-versatile`)

Useful next production inputs from you:

- Official Clark building links, hours, and facility details
- Approved campus map coordinates or exported building dataset
- Branding assets or visual guidelines
- A verified SMTP sender for Cortex verification emails
- Any university FAQ pages or student-services links you want loaded into the knowledge base

## Supabase

Run the SQL files in [`supabase/migrations`](/M:/Projects/CorteX/supabase/migrations) in order:

1. `001_initial_schema.sql`
2. `002_seed_campus.sql`
3. Continue through the remaining numbered migrations, including `007_add_marketplace_and_canvas.sql` for marketplace, Canvas, RLS policies, and the public `marketplace` storage bucket.

## Marketplace Payments

The student marketplace uses Stripe PaymentIntents with a 10% platform fee. Configure:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

In Stripe Dashboard, create a webhook endpoint for:

```text
https://grove-green-theta.vercel.app/api/webhooks/stripe
```

Listen for `payment_intent.succeeded` and `charge.refunded`. Use Stripe test card `4242 4242 4242 4242` for local test purchases.

## Canvas OAuth

Register Grove as an OAuth app in each university Canvas admin:

- App name: `Grove`
- Redirect URI: `https://grove-green-theta.vercel.app/api/auth/canvas/callback`
- Scopes: `url:GET|/api/v1/courses` and `url:GET|/api/v1/courses/:course_id/assignments`

Add the resulting client ID and secret to the matching environment variables, for example `CANVAS_CLARK_CLIENT_ID` and `CANVAS_CLARK_CLIENT_SECRET`. The Canvas settings page starts the OAuth flow at `/api/auth/canvas`, stores the token, and syncs assignments into `canvas_assignments`.

## Notes

- Route handlers currently use a shared in-memory repository for demo mode.
- Supabase realtime hooks are scaffolded for status and conversation subscriptions when environment variables are present.
- Password change and destructive account deletion UI are present, but the production removal flow still needs to be connected to live Supabase auth/admin operations.
