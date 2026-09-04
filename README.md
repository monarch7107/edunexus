# EduNexus

**Everything a student needs to manage and improve their education, in one place.**

EduNexus is a unified student workspace for Smart India Hackathon: subjects &
tasks with deadlines/priorities, a study planner, saved learning resources,
progress insights, and one constrained AI feature — a study-priority
recommendation that uses the student's real academic data and **always has a
rule-based fallback**, so the app never breaks if AI is unavailable.

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + Row Level Security) — optional at dev time
- AI: any OpenAI-compatible Chat Completions API (server-side only)

The app runs in two modes via a single repository interface (`lib/repo`):

| Mode | When | Backend |
| --- | --- | --- |
| **Demo** | `NEXT_PUBLIC_SUPABASE_*` env vars unset | Browser localStorage — zero setup, fully clickable |
| **Supabase** | env vars set | Postgres + Supabase Auth + RLS |

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Demo mode needs no configuration. Register an account and all data persists in
the browser.

## Configure Supabase (production)

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) —
   creates all tables, the auto-profile trigger, RLS policies and indexes.
3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
   # optional AI:
   OPENAI_API_KEY=sk-...
   OPENAI_BASE_URL=https://api.openai.com/v1   # any OpenAI-compatible endpoint
   OPENAI_MODEL=gpt-4o-mini
   ```

Restart `npm run dev`. The app now uses Postgres, Supabase Auth and RLS —
users can only ever read/write their own rows.

> **SIH demo tip:** in Supabase, go to *Authentication → Sign In / Providers →
> Email* and turn **OFF** "Confirm email" so new accounts get a session
> immediately after register (no email verification step during the demo).

## Security notes

- RLS policies enforce that every row is only accessible by its owner.
- The anon key is public by design (RLS is the gate); the service-role key is
  never used or referenced.
- AI API keys are server-side only (`/app/api/recommend`); the browser only
  sends the student's own data snapshot.
- All inputs are validated client-side and dates/IDs are validated by Postgres
  constraints; AI output is shape-validated before rendering.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing (problem, solution, features, CTA) |
| `/register`, `/login` | Email/password auth |
| `/onboarding` | Name, course, branch, semester, goals |
| `/dashboard` | Greeting, priority tasks, overdue, today's sessions, AI plan, progress, quick actions |
| `/academics` | Subjects (CRUD) + tasks (CRUD, filters, deadlines, priorities, status) |
| `/planner` | Study sessions by date, study-time totals |
| `/learning` | Notes & links per subject, search/filter |
| `/insights` | Completion %, overdue, 7-day study chart, subject progress, priorities |
| `/profile` | Edit details, backend mode, sign out |

## AI behavior (spec §14)

`POST /api/recommend` receives the student's real data snapshot and returns a
prioritized study plan. If `OPENAI_API_KEY` is missing, the model fails, or
output validation fails, the server returns the deterministic fallback:
**overdue → due today → nearest deadline → highest priority**. API keys stay
server-side; AI output is validated/shape-checked before rendering.

## Deploy

- **Vercel**: import the repo, set the environment variables above, deploy.
- Works out of the box in demo mode with no env vars set.
