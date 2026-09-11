# EduNexus — Testing

## Suites

| Suite | Command | Engine | What it proves |
| --- | --- | --- | --- |
| Unit | `npm run test:unit` | Vitest (node) | Behavior of every `lib/` module: repo error categories, refresh coordinator, dates, onboarding validation, offline queue/sync, theme parsing, V1 AI reliability (snapshot/shape validation, failure classes, fallback), V2 agentic pipeline (intent, routing, schema validation, tool permissions, ownership, approvals, prompt injection, gateway, full request→plan→approve→execute→verify, idempotency ledger), activity store, cookie sync, body limits, intelligence signals |
| RLS (real PostgreSQL) | `npm run test:rls` | Vitest + **PGlite** (PostgreSQL 16 compiled to WASM) | Loads the **actual** `supabase/*.sql` migrations into a real Postgres engine and runs adversarial cross-user checks as a non-owning `authenticated` role with a request-scoped `auth.uid()` — exactly how Supabase enforces policies. Catches policy/schema regressions (it previously caught a policy-quoting syntax error and a non-idempotent `create policy`) |
| Migration idempotency | (part of unit) `tests/security/migration-idempotency.test.ts` | Vitest + PGlite | Applies every migration **twice** to real Postgres; re-running the SQL must never error |
| E2E | `npm run test:e2e` | Playwright (Chromium) | Full student journeys in the real UI: `tests/e2e/` — `workspace.spec.ts` (core V1 journey + accessibility), `v1-reliability.spec.ts` (RC1–RC6 user-facing flows), `planner-copilot.spec.ts` (V2 propose/reject/no-silent-writes), `v2-ui.spec.ts` (AI Command Center propose/edit/re-approve/verify, approvals, activity, adaptive planner, risk, resource intelligence + axe checks), `theme.spec.ts` (four themes × light/dark persistence, mobile, axe), `hosted-supabase.spec.ts` (see gate below) |
| Python (experimental) | `PYTHONPATH=python python -m pytest python/tests -q` (run from `python/` or with `python/.venv`) | pytest | The experimental intelligence package: feature engineering + synthetic-data pipeline (see `python/README.md`) |

## The hosted-Supabase gate

`tests/e2e/hosted-supabase.spec.ts` runs the **full agentic flow against a
real hosted project** (register → real data → Planning Agent → approve → real
DB mutation → verification → reload proves durability; plus two-real-user
isolation and unauthenticated rejection). It **self-skips unless** both
`NEXT_PUBLIC_SUPABASE_*` are set **and** `RUN_HOSTED_SUPABASE=1` — demo mode
is deliberately never accepted as hosted evidence:

```bash
npm run build && npm run start
RUN_HOSTED_SUPABASE=1 \
  NEXT_PUBLIC_SUPABASE_URL=https://ohuyargnnzasdfjbffva.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  npx playwright test tests/e2e/hosted-supabase.spec.ts
```

## How to run everything

```bash
npm install
npm run typecheck
npm run lint
npm run test:unit        # includes RLS (PGlite) + idempotency
npm run test:rls         # RLS only
npm run build
npm run test:e2e         # needs a browser: npx playwright install chromium
# python (experimental):
cd python && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
PYTHONPATH=python python -m pytest python/tests -q
```

Playwright can target a running instance with `PLAYWRIGHT_BASE_URL` and a
non-CDN browser with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Reporting rules

- Test counts in historical documents (e.g.
  `docs/sih/readiness-report-2026-09-10.md`) are **historical** — always
  report the numbers from a run you actually performed.
- A suite that cannot run in the current environment (e.g. hosted Supabase
  without egress, Playwright without a browser binary) is reported as
  **BLOCKED (environment)**, never as PASS or NOT RUN-in-good-faith.
- Tests are never modified to hide regressions; moving/renaming test files
  updates paths only.
