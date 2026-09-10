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

| Mode         | When                                    | Backend                                            |
| ------------ | --------------------------------------- | -------------------------------------------------- |
| **Demo**     | `NEXT_PUBLIC_SUPABASE_*` env vars unset | Browser localStorage — zero setup, fully clickable |
| **Supabase** | env vars set                            | Postgres + Supabase Auth + RLS                     |

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
2. In the SQL Editor, run the migrations in order — all are additive and
   **idempotent** (safe to re-run):
   - [`supabase/schema.sql`](supabase/schema.sql) — V1 tables, auto-profile
     trigger, RLS policies, indexes.
   - [`supabase/v2_agentic.sql`](supabase/v2_agentic.sql) — V2 agentic audit
     tables (`agent_runs`, `agent_actions`, `change_sets`, `change_items`,
     `agent_approvals`) with owner RLS policies.
   - [`supabase/v2_agentic_step19.sql`](supabase/v2_agentic_step19.sql) —
     `proposal_hash` + `mutation_id`.
   - [`supabase/v2_agentic_step20.sql`](supabase/v2_agentic_step20.sql) — the
     unique idempotency index on `(user_id, mutation_id)`.
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

> **SIH demo tip:** in Supabase, go to _Authentication → Sign In / Providers →
> Email_ and turn **OFF** "Confirm email" so new accounts get a session
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

| Route                 | Purpose                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| `/`                   | Landing (problem, solution, features, CTA)                                            |
| `/register`, `/login` | Email/password auth                                                                   |
| `/onboarding`         | Name, course, branch, semester, goals                                                 |
| `/dashboard`          | Greeting, priority tasks, overdue, today's sessions, AI plan, progress, quick actions |
| `/academics`          | Subjects (CRUD) + tasks (CRUD, filters, deadlines, priorities, status)                |
| `/planner`            | Study sessions by date, study-time totals                                             |
| `/learning`           | Notes & links per subject, search/filter                                              |
| `/insights`           | Completion %, overdue, 7-day study chart, subject progress, priorities                |
| `/profile`            | Edit details, backend mode, sign out                                                  |

## AI behavior (spec §14)

`POST /api/recommend` receives the student's real data snapshot and returns a
prioritized study plan. If `OPENAI_API_KEY` is missing, the model fails, or
output validation fails, the server returns the deterministic fallback:
**overdue → due today → nearest deadline → highest priority**. API keys stay
server-side; AI output is validated/shape-checked before rendering.

## Deploy

- **Vercel**: import the repo, set the environment variables above, deploy.
- Works out of the box in demo mode with no env vars set.

## Workspace design & preferences

The UI uses a shared design system rather than page-specific color overrides:

- **DM Sans + Manrope variable fonts**, served locally by the app.
- Semantic surface, text, status, border, and accent tokens in `app/globals.css`
  and `tailwind.config.ts`.
- **Light, dark, and system appearance**, with Forest, Iris, and Terracotta
  accents. Preferences are stored on the current device, synchronized across
  tabs, and applied by a small pre-paint script to prevent a theme flash.
- Framer Motion list, dialog, content, chart, and notification transitions;
  CSS button feedback; real operation loading states and skeletons. Both the
  system reduced-motion setting and the optional in-app setting are respected.
- Keyboard-accessible dialogs with focus trapping/restoration, focus styles,
  associated field hints/errors, chart labels, and responsive navigation.
- Workspace search (`Ctrl/Cmd + K`) opens matching subjects, tasks, sessions,
  and resources in their existing routes. Search, status, priority, subject,
  calendar, resource-view, and chart-range controls operate on real data.

### Learning files: an intentional capability boundary

**Direct file uploads are not enabled.** This repository has no configured
Supabase Storage bucket or storage policies, and the resource schema supports
notes and links—not stored file records. No bucket, schema migration, public
upload endpoint, or privileged credential has been added for the redesign.

The file workflow provides drag-and-drop/browse selection, type and 20 MB size
validation, file details, local image previews, and remove/cancel controls.
It explicitly labels files **“Selected locally · Not uploaded”**, disables the
upload action, and clears selection on close. It sends **no upload request**,
creates **no resource record**, and displays **no fake progress or success**.
Object URLs are revoked after use.

Students can continue saving notes and hosted document/image links through the
existing repository. PDFs and Word/image URLs are visually identified in the
library, and full notes can be read in a dialog. Enabling actual file transfer
later requires an authenticated private storage integration and reviewed
owner-scoped policies; it must not be enabled by simply removing the UI guard.

## UI verification

```bash
npm run typecheck
npm run lint
npm run build

# In demo mode (NEXT_PUBLIC_SUPABASE_* unset), start the app:
npm run start -- --hostname 0.0.0.0
# In another terminal:
npx playwright install chromium
npm run test:e2e
```

The browser suite creates isolated test accounts and covers registration,
login/logout, onboarding, CRUD and completion flows, subject unlinking,
recommendation fallback and retries, save failures, search, theme persistence,
file-capability honesty, focus behavior, and WCAG A/AA automated checks.
It exercises mobile navigation and both light and dark themes. Test traces,
screenshots, and reports are ignored by Git. Set `PLAYWRIGHT_BASE_URL` to test a
separately running instance; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally
selects an existing Chromium binary (e.g. one distributed via npm when the
Playwright CDN is unreachable).

### Real PostgreSQL RLS test

```bash
npm run test:rls   # or: it also runs as part of `npm run test:unit`
```

`tests/unit/rls-postgres.test.ts` boots **PGlite** (PostgreSQL 16 compiled to
WASM — a real Postgres engine with real Row Level Security), loads the actual
`supabase/*.sql` migrations, and runs adversarial two-user checks as a
non-owning `authenticated` role whose identity comes from a request-scoped
`auth.uid()`, exactly like Supabase. This validates the RLS policies and schema
without needing a hosted Supabase project. It is not a substitute for a final
smoke test against a real Supabase instance, but it does catch policy/schema
regressions (it caught a policy-quoting syntax error in `v2_agentic.sql` and a
non-idempotent `create policy` in `schema.sql`).

`tests/unit/migration-idempotency.test.ts` additionally applies every migration
**twice** into real Postgres to guarantee re-running the SQL never errors.

### Hosted-Supabase end-to-end certification

`tests/hosted-supabase.spec.ts` runs the **full agentic flow against a real
hosted Supabase project** (register → real academic data → Planning Agent →
approve → real DB mutation → verification → reload proves durable persistence,
plus a two-real-user isolation check and an unauthenticated-rejection check).

It only runs when a hosted project is actually configured, and **self-skips**
otherwise — demo/localStorage mode is deliberately NOT accepted as hosted
evidence. To run it:

```bash
# after configuring .env.local and applying the migrations:
npm run build && npm run start        # in one terminal
RUN_HOSTED_SUPABASE=1 \
  NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  npx playwright test tests/hosted-supabase.spec.ts
```

**Current status:** this suite has NOT been run against a hosted project in the
build environment (no credentials and network egress to `*.supabase.co` is
blocked), so hosted Supabase certification remains **BLOCKED** and the overall
verdict is **CONDITIONALLY READY**. See `SIH_READINESS_REPORT.md` §19.

**Scope:** the repository interface, Supabase implementation, schema, RLS,
middleware, and recommendation API are unchanged. The shared data provider now
surfaces safe, retryable read errors and friendly mutation errors rather than
silently hiding failures or displaying raw database details. SQL calendar dates
are interpreted as local dates so planner days do not shift across timezones.
Live Supabase/email delivery and external AI-provider connectivity require an
appropriately configured deployment and are not exercised by local-mode tests.

**Dependency note:** `npm audit` currently flags the existing Next.js 14 tree.
The suggested remediation is a major framework upgrade; that migration is
separate from this UI/UX change and has not been applied automatically.
