# EduNexus — System Architecture

EduNexus is a **single Next.js full-stack application** (App Router). It is
deliberately **not** a microservices system: one deployable, one database
(Supabase Postgres), one repository contract, two backends behind that
contract.

## The two product layers

| Layer | What it is | Where it lives |
| --- | --- | --- |
| **V1 — Reliable academic workspace** | Subjects, tasks, deadlines, study sessions, resources, profile, onboarding, dashboard, insights, deterministic academic signals, one constrained AI recommendation (study-priority ranking with rule-based fallback) | `app/`, `components/`, `lib/repo`, `lib/intelligence.ts`, `lib/recommendation*.ts`, `app/api/recommend` |
| **V2 — Safe agentic academic intelligence** | The Planning Agent vertical slice: "Optimize my study schedule" — gateway → orchestrator → agent → tools → authorization → approval → execution → verification, with durable audit tables | `lib/ai/`, `app/api/ai*`, `app/(app)/ai/**`, `supabase/v2_agentic*.sql` |

**V2 is built on top of V1, never instead of it.** The agent's read/write
tools operate through the same durable stores V1 uses, and the UI is the same
workspace — the agent's output appears as a proposed *Change Set* that the
student approves before anything is mutated.

## Request paths

```
Browser (React 18, App Router pages in app/)
  │
  ├── Data pages (dashboard, academics, planner, learning, resources, insights)
  │     └── components/providers/app-data.tsx (single data provider,
  │           race-safe refresh coordinator from lib/workspace-refresh.ts)
  │           └── lib/repo  ← one interface, two implementations
  │                 ├── SupabaseRepo (lib/repo/supabase.ts)  — Postgres + Auth + RLS
  │                 └── DemoRepo     (lib/repo/demo.ts)      — browser localStorage
  │
  ├── V1 AI: dashboard recommendation card
  │     └── POST /api/recommend  (server-only, lib/recommendation-server.ts)
  │           └── OpenAI-compatible Chat Completions, or deterministic fallback
  │
  └── V2 AI: Copilot / AI Command Center / Approval Center / Adaptive Planner
        └── lib/ai/client.ts  →  POST /api/ai, /api/ai/approve, /api/ai/changeset
              └── lib/ai/gateway.ts  (identity, limits, rate limiting)
                    └── lib/ai/orchestrator.ts
                          └── lib/ai/agents/planning.ts  (LLM reasoning only)
                                └── lib/ai/tools/registry.ts → tools/sessions.ts
                                      └── authorization.ts (allowlists + approval gates)
                                            └── approvals.ts (proposal_hash)
                                                  └── persist.ts (durable writes)
                                                        └── verification.ts (reread)
```

Middleware (`middleware.ts`) guards all private routes in both modes:
demo-mode uses a signed-in cookie, Supabase mode refreshes the session via
`@supabase/ssr` with ordered cookie replay (`lib/supabase/cookie-sync.ts`) so
redirects never drop a refreshed session.

## Modes

| Mode | Trigger | Persistence | AI planning persistence |
| --- | --- | --- | --- |
| **Demo** | `NEXT_PUBLIC_SUPABASE_*` unset | localStorage, one repo per browser profile | process-memory store, honestly labeled as demo |
| **Supabase** | both env vars set | Postgres with RLS (`auth.uid() = user_id`) | durable audit tables (`agent_runs`, …) — the system of record |

`lib/ai/persistence-mode.ts` makes this distinction explicit in code and UI:
demo-mode agentic state is **never** described as production durability.

## Directory ownership (the map judges and new developers need)

```
app/
  (auth)/        login, register (public)
  (app)/         dashboard, academics, planner (+ adaptive), learning,
                 resources (+ intelligence), insights, onboarding, profile,
                 risk, ai (command center + approvals + activity)
  api/           recommend (V1 AI), ai + ai/approve + ai/changeset (V2 gateway)
components/
  ui/ shell/ theme/ providers/      shared primitives, app chrome, theming
  landing/ auth/ dashboard/ academics/ planner/ learning/
  resources-insights-ai/…            feature-scoped UI, no cross-feature
                                     components live in ui/
lib/
  auth-ish:      session-cookie.ts, supabase/ (server/client/cookie-sync)
  data:          repo/ (contract + 2 impls), types.ts, workspace-refresh.ts,
                 demo-seed.ts, intelligence.ts (deterministic signals)
  ai:            ai/  = the V2 agentic system ONLY (see ai-architecture.md)
  V1 AI:         recommendation.ts (client) / recommendation-server.ts (server)
  offline:       offline/ (queue, sync engine, account isolation)
  theming:       theme.ts (preference model)
  validation:    dates.ts, profile.ts (onboarding rules), resources.ts,
                 api/body.ts (bounded request bodies)
supabase/        SQL migrations — infrastructure, applied in documented order
python/          experimental intelligence research (NOT production; see README)
tests/
  unit/          vitest — behavior of lib modules
  security/      vitest — RLS against real PostgreSQL (PGlite) + migration idempotency
  e2e/           Playwright — full user journeys, theme, accessibility, hosted gate
scripts/         generate-themes.py — token generator + WCAG contrast gate
docs/            architecture / ai / design / security / testing / sih
```

## Design principles that shaped the code

1. **One repository contract.** Pages and hooks never know which backend they
   talk to. Demo mode exists so the product is fully demonstrable with zero
   infrastructure — and so it is honest: demo-mode storage is always labeled.
2. **Deterministic intelligence first.** `lib/intelligence.ts` (workload,
   evidence, subject attention) is rule-based and mirrored in the Python
   research package. The UI never depends on a trained model.
3. **Server-derived identity everywhere.** The client never supplies a
   `user_id` for authoritative operations; server routes resolve identity
   from the session (or the demo cookie) and reject client-provided ids in
   the AI gateway.
4. **Fail loudly, degrade gracefully.** Every read path surfaces categorized,
   friendly failures (`RepoError`); the AI path always has a deterministic
   fallback so the app "never breaks" without ever silently faking an answer.
5. **Tokens, not colors.** All color comes from the four-palette semantic
   token system (see `docs/design/`).
