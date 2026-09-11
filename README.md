# EduNexus — SIH 2026 Final Prototype

> **Everything a student needs for managing and improving their education, in
> one place.** — and, from V2, an adaptive academic ecosystem that
> understands the student, their learning needs, and their academic journey.

**Smart India Hackathon 2026 · Problem Statement ID `26207` · AICTE, MIC –
Student Innovation · Software · Smart Education**

> *"Student Innovation – Smart education, a concept that describes learning in
> digital age. It enables learners to learn more effectively, efficiently,
> flexibly and comfortably."*

## What this is

- **V1 — Reliable unified academic workspace.** Subjects, tasks (deadlines,
  priorities, completion), study sessions, resources, onboarding, profile,
  dashboard, insights, deterministic academic signals, and one constrained AI
  feature — a study-priority recommendation built on the student's real data,
  with a **deterministic fallback** so the app never breaks.
- **V2 — Safe agentic academic intelligence** *(the adaptive layer built on
  the V1 foundation)*. First vertical slice: **"Optimize my study
  schedule."** The Planning Agent proposes a Change Set; the student
  **Approves / Edits / Rejects**; only then does authorized execution run, is
  verified by rereading the durable store, and is written to the activity
  history. *The LLM can reason. It cannot authorize itself.*
- **Premium four-theme design system** (Sapphire · Royal Gold · Neon ·
  Aurora Scholar) × light/dark, on semantic tokens with a WCAG AA contrast
  gate.
- **PWA / offline foundation** with honest capability boundaries.
- **Supabase + PostgreSQL + RLS**, with a zero-infrastructure demo mode
  behind the same repository contract.

Full documentation: [`docs/`](docs/) — architecture, AI safety, data,
security, testing, design, and the SIH kit (problem statement, demo script,
technical summary, historical certification report).

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (token-driven) + **Framer Motion** (respects reduced motion)
- **Supabase** (Postgres + Auth + Row Level Security) — optional at dev time
- AI: any OpenAI-compatible Chat Completions API, **server-side only**
- Testing: Vitest, **PGlite** (real PostgreSQL 16 in WASM for RLS tests),
  Playwright + axe, pytest (experimental Python research)
- Deploy: **Vercel** — production: `https://edunexus-pied.vercel.app`

The app runs in two modes via a single repository interface (`lib/repo`):

| Mode         | When                                    | Backend                                            |
| ------------ | --------------------------------------- | -------------------------------------------------- |
| **Demo**     | `NEXT_PUBLIC_SUPABASE_*` env vars unset | Browser localStorage — zero setup, fully clickable, clearly labeled |
| **Supabase** | env vars set                            | Postgres + Supabase Auth + RLS                     |

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Demo mode needs no configuration: register an account and all data persists
in the browser. An empty dashboard offers **"Load sample workspace"**
(coherent, dynamically-dated sample data, clearly marked as demo data).

## Configure Supabase (production)

1. Use the project `ohuyargnnzasdfjbffva` (ap-northeast-1) —
   `https://ohuyargnnzasdfjbffva.supabase.co`.
   (⚠️ `ossgcgnsmftbymwtyvpn` is a different, incorrect project — never use it.)
2. All V2 migrations are already applied to the hosted project. For a fresh
   project, run in order — all are additive and **idempotent**:
   - [`supabase/schema.sql`](supabase/schema.sql) — V1 tables, auto-profile
     trigger, RLS policies, indexes
   - [`supabase/v2_agentic.sql`](supabase/v2_agentic.sql) — V2 agentic audit
     tables (`agent_runs`, `agent_actions`, `change_sets`, `change_items`,
     `agent_approvals`) with owner RLS
   - [`supabase/v2_agentic_step19.sql`](supabase/v2_agentic_step19.sql) —
     `proposal_hash` + `mutation_id`
   - [`supabase/v2_agentic_step20.sql`](supabase/v2_agentic_step20.sql) — the
     unique idempotency index on `(user_id, mutation_id)`
3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
   # optional AI:
   OPENAI_API_KEY=sk-...
   OPENAI_BASE_URL=https://api.openai.com/v1   # any OpenAI-compatible endpoint
   OPENAI_MODEL=gpt-4o-mini
   ```

> **SIH demo tip:** in Supabase, go to _Authentication → Sign In / Providers →
> Email_ and turn **OFF** "Confirm email" so new accounts get a session
> immediately after register.

## Pages

| Route                 | Purpose                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| `/`                   | Landing (problem, solution, features, CTA)                                            |
| `/register`, `/login` | Email/password auth                                                                   |
| `/onboarding`         | Name, course, branch, semester, goals (validated)                                     |
| `/dashboard`          | Greeting, priority tasks, overdue, today's sessions, AI plan, progress, quick actions |
| `/academics`          | Subjects (CRUD) + tasks (CRUD, filters, deadlines, priorities, status)                |
| `/planner`            | Study sessions by date, weekly strip, study-time totals, schedule copilot             |
| `/planner/adaptive`   | V2 adaptive planner (gateway-connected)                                               |
| `/learning`           | Notes & links per subject, search/filter, honest file-upload boundary                 |
| `/resources/intelligence` | Resource intelligence (deterministic subject attention)                          |
| `/insights`           | Completion, overdue, 7-day study chart, subject progress, priorities, workload        |
| `/risk`               | Academic risk overview (rule-based signals + evidence)                                |
| `/ai`                 | **AI Command Center** — Copilot + Planning Agent runs                                |
| `/ai/approvals`       | **Approval Center** — pending/decided Change Sets (approve / edit / reject)           |
| `/ai/activity`        | **Agent Activity** — full run history (proposed → approved → executed → verified)     |
| `/profile`            | Edit details, backend mode, appearance (4 themes × light/dark), sign out              |

## AI — what it actually is

**V1 — constrained study recommendation** (`POST /api/recommend`). Uses only
the student's supplied data snapshot (goals, subjects, tasks, sessions,
minutes studied). Server-only provider key, ~15 s provider / ~25 s client
timeouts, snapshot **and** output validation, and a deterministic fallback
(overdue → due today → nearest deadline → highest priority). Not a chatbot.

**V2 — Planning Agent** (`/api/ai`, `/api/ai/approve`, `/api/ai/changeset`).
Gateway (server identity, client `user_id` rejection, bounded bodies, rate
limits) → Orchestrator → Planning Agent (reasons only over supplied context)
→ plan validated against the student's real data → **Change Set**
(`proposal_hash`) → student approval → authorized tools
(`getSubjects` / `getTasks` / `getStudySessions`,
`create/update/deleteStudySession`) → durable execution with
`mutation_id` idempotency → **verification reread** → activity history.
See [`docs/ai/safety-and-agent-model.md`](docs/ai/safety-and-agent-model.md).

## Security (summary)

- RLS on every table: `auth.uid() = user_id`; anon key public by design;
  **no service-role key anywhere in the repo**
- Server-derived identity; client `user_id` rejected; auth failures fail closed
- AI keys server-side only; proposal hashes; mutation idempotency;
  verification rereads; prompt-injection posture (academic content = untrusted
  data)
- Offline queue: allowlisted mutations only, per-account isolation, no
  caching of `/api` or private pages in the service worker
- Known, honestly-documented items (Supabase advisor warnings, demo-mode
  hashing, `npm audit` on the Next 14 tree):
  [`docs/security/security.md`](docs/security/security.md)

## Testing & quality

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint (Next core-web-vitals + typescript)
npm run test:unit      # Vitest: unit + PGlite RLS + migration idempotency
npm run test:rls       # RLS only (real PostgreSQL engine via PGlite)
npm run build          # production build
npm run test:e2e       # Playwright journeys (npx playwright install chromium)
# experimental python research (see python/README.md):
cd python && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
PYTHONPATH=python python -m pytest python/tests -q
```

`tests/e2e/hosted-supabase.spec.ts` runs the full agentic flow against the
real hosted project but **self-skips** unless `RUN_HOSTED_SUPABASE=1` plus the
Supabase env vars are set — demo mode is never accepted as hosted evidence.
Suite layout: `tests/unit` (Vitest), `tests/security` (Vitest + PGlite RLS),
`tests/e2e` (Playwright). Details and the reporting rules:
[`docs/testing/testing.md`](docs/testing/testing.md).

`npm audit` currently flags the existing Next.js 14 dependency tree; the
remediation is a major framework upgrade, deliberately deferred out of scope
for the SIH prototype.

## Design & offline (summary)

- Four palettes × light/dark on semantic tokens; `app/themes.css` is
  generated by `scripts/generate-themes.py` with a WCAG AA contrast gate —
  never hand-edit it. Details: [`docs/design/`](docs/design/)
- PWA: manifest + service worker caching **only the public shell**; offline
  queue for allowlisted task/session mutations with conflict detection and
  account isolation; AI honestly reports unavailability offline.

## Experimental ML (research, not production)

`python/` is an isolated research package (feature engineering, synthetic
demo data, an experimental workload model, evaluation) — clearly labeled,
synthetic-data only, no FastAPI (deliberately deferred). The live app uses
the **deterministic** TypeScript signals in `lib/intelligence.ts` and never
depends on the Python model. See `python/README.md`.

## Deployment

- **Vercel**: import the repo, set the environment variables, deploy.
- Production domain: `https://edunexus-pied.vercel.app`
- Works out of the box in demo mode with no env vars set.

## Limitations (honest)

- Hosted Supabase E2E certification requires a live, reachable project
  (suite self-skips otherwise); venue demos should prefer demo mode.
- Demo mode stores data in the browser (local-only, SHA-256 hashing) — it is
  a demonstration backend, not a credential store.
- The Python workload model is synthetic-data research, not a production
  predictor; no trained model is served to students.
- Direct file uploads are an intentional capability boundary (notes + links
  are supported; file transfer needs a future private-storage integration).
- Open Supabase console items are documented in
  `docs/security/security.md` — the project does not claim "zero security
  issues".

## Repository map

```
app/            (auth) + (app) route groups, api/ (recommend + ai gateway)
components/     ui · shell · theme · providers · landing · auth · dashboard
                · academics · planner · learning · insights · ai
lib/            repo (contract + 2 backends) · ai/ (V2 system) ·
                recommendation*.ts (V1 AI) · intelligence · offline ·
                supabase · theme · validation helpers
supabase/       migrations (applied, idempotent, documented order)
python/         experimental intelligence research (isolated)
tests/          unit · security (RLS via real Postgres) · e2e (Playwright)
docs/           architecture · ai · design · security · testing · sih
scripts/        generate-themes.py (token generator + contrast gate)
```
