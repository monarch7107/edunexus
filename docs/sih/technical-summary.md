# EduNexus — Technical Summary (SIH 2026, Problem Statement 26207)

**One paragraph.** EduNexus is an adaptive academic ecosystem for students:
a reliable academic workspace (V1) with a safe agentic intelligence layer on
top (V2). It unifies subjects, tasks with deadlines and priorities, study
sessions, and resources in one responsive, four-theme, PWA-capable
workspace; and it adds a constrained, approval-gated Planning Agent that can
propose — but never silently execute — study-schedule changes, with
verification and a durable audit trail.

**Stack.** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS +
Framer Motion; Supabase (Postgres + Auth + Row Level Security) with a
demonstration mode that runs the identical repository contract on browser
storage; server-side AI against any OpenAI-compatible endpoint
(`gpt-4o-mini` default) with deterministic fallbacks; Vercel deployment;
Vitest + PGlite (real PostgreSQL 16 in WASM) + Playwright (+ axe) + pytest.

**Architecture in one line.** One full-stack app, one database, one
repository contract, two backends; the AI path is
*Gateway → Orchestrator → Planning Agent → Tools → Authorization → Approval
→ Execution → Verification* — all server-side, all audited.

**The security story (30 seconds).**

1. RLS on every table: `auth.uid() = user_id` — the anon key is public by
   design; RLS is the gate; no service-role key exists in the repo.
2. The LLM can reason; it cannot authorize itself: server-derived identity,
   client `user_id` rejected, five-tool allowlist, no SQL access, no
   self-permissions.
3. Human approval: every mutation is a Change Set bound by a
   `proposal_hash`; editing invalidates approval; execution requires the
   matching approved hash.
4. Idempotency: deterministic `mutation_id` + unique DB constraint
   `(user_id, mutation_id)` — replays and double-clicks cannot double-execute.
5. Verification: after execution the system rereads the durable store and
   reports what actually changed.
6. Honest offline: only allowlisted task/session mutations are queued,
   isolated per account; private API responses are never cached; AI says
   "unavailable offline" instead of pretending.

**What was demonstrated in the repository's test history** (current numbers
are produced by running the suite — see `docs/testing/testing.md`): unit
coverage of every reliability fix (RC1–RC6), adversarial RLS checks against
real PostgreSQL, migration idempotency, full E2E journeys including the V2
propose/edit/re-approve/execute/verify loop, theme and accessibility
validation, and a gated hosted-Supabase certification suite.

**Honest limitations.** Hosted Supabase certification requires a live
project with network access (the suite self-skips otherwise); demo mode uses
browser storage (SHA-256 password hashing, local-only); the Python workload
model is synthetic-data research, not a production model; a few Supabase
console settings (leaked-password protection) are documented as open items
in `docs/security/security.md`.
