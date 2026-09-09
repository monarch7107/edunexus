# EduNexus V2 — Controlled Agentic AI

**Smart India Hackathon 2026 · PS 26207 · AICTE · Smart Education**

Baseline: `ac1b374` (V1, frozen). V2 is additive — no V1 table, repository
method or behaviour was changed.

---

## The one rule

> **The LLM can reason. The LLM cannot authorize itself.**

The model never sees a user id, never touches the database, never executes a
tool, and never decides what is permitted. It returns a *proposal*. Everything
after that is deterministic server code.

```
Student request
  → AI Gateway            authenticate · bound · validate · rate-limit
  → Orchestrator          detect intent · route
  → Planning Agent        reason over authorized context only
  → Structured plan       Zod-validated; malformed output rejected
  → Server validation     ownership · bounds · unknown IDs dropped
  → Change Set            every proposed change made visible
  → Student approval      explicit, fingerprinted, expiring
  → Authorization         7 checks, model-independent
  → Tool execution        the only path to the database
  → Verification          re-read the DB and compare
  → Student-visible result
```

The database is the source of truth. The LLM is not.

---

## First vertical slice

One complete workflow: **"Optimize my study schedule."**

One agent (`planning`), one intent (`optimize_schedule`), one entity
(`study_session`). No other agents or intents are implemented.

---

## Files

### Core (`lib/ai/`)
| File | Role |
|---|---|
| `types.ts` | Agent/intent/status types, records, API shapes |
| `schemas.ts` | Zod boundary for requests and **all** model output |
| `errors.ts` | `AgentError` wrapping the **existing V1** `RepoError` categories |
| `limits.ts` | Hard safety bounds |
| `gateway.ts` | Authenticate, bound the body, validate, assign request id |
| `orchestrator.ts` | Intent detection, routing, change sets, execute, verify |
| `authorization.ts` | `Principal`, budgets, ownership, approval, rate limit |
| `approvals.ts` | Fingerprinting; stale/expired approval rejection |
| `verification.ts` | Re-read actual state; honest roll-up |
| `provider.ts` | OpenAI-compatible call (server-only, 15s timeout) |
| `runtime.ts` | Supabase wiring; fails closed in demo mode |
| `client.ts` | Browser client; validates every response shape |
| `agents/planning.ts` | The Planning Agent + hardened system prompt |
| `agents/schedule-logic.ts` | Deterministic findings + rule-based fallback |
| `tools/registry.ts` | The enforcement point |
| `tools/sessions.ts` | 3 read tools, 3 write tools |
| `store/` | `AcademicPort` / `AgentStore` ports + Supabase & memory impls |

### API
`POST /api/ai` (propose) · `POST /api/ai/approve` · `POST /api/ai/edit`

Only `/api/ai/approve` can cause a write, and only after every check passes.

### UI (`components/ai/`)
`copilot.tsx` · `agent-status.tsx` · `change-set.tsx` · `approval-panel.tsx` ·
`execution-result.tsx` — mounted on the Planner. Not a generic chatbot.

### Migration
`supabase/migrations/0002_v2_agentic.sql`

---

## Database

Five new user-owned tables: `agent_runs`, `agent_actions`, `change_sets`,
`change_items`, `agent_approvals`.

- RLS on every table: `auth.uid() = user_id` for both `using` and `with check`.
- `change_items` denormalizes `user_id` for a simple, index-friendly predicate.
- **Same-owner triggers** prevent a child row from ever being attached to a
  parent owned by someone else — RLS alone would not catch that.
- `agent_runs.input_summary` stores a bounded summary; raw prompts are not
  persisted.

---

## Authorization chain

Every tool invocation, in order:

1. authenticated user present
2. tool is registered
3. agent is on the tool's static allowlist
4. input passes the tool's Zod schema
5. per-run budget not exhausted (≤10 tool calls, ≤3 iterations)
6. **approval valid** — writes only, re-checked at execution time so an
   approval that expires between review and execution still blocks
7. resource ownership + business rules (inside the tool)

The model cannot influence any of these. `allowedAgents` is a static constant.

### Ownership
A row belonging to another user is indistinguishable from a missing row, so
the pipeline never leaks the existence of another student's data.

### Stale approvals
`fingerprintChangeItems()` hashes the executable content (operation, target,
payload) of a change set. Approving records the fingerprint; executing
re-computes it. Any edit changes the hash and the approval is refused.

---

## Prompt injection defence

Academic content is attacker-controllable — anyone can put text in a task
title. Defence is layered, and **the last layer does not depend on the model**:

1. The system prompt states that all academic content is untrusted data.
2. Content is fenced in explicit `BEGIN/END UNTRUSTED …` blocks.
3. **Even if the model fully complies with an injection**, the server drops it:
   `delete` is stripped in validation, unknown IDs are rejected, unowned rows
   are rejected, and every write still needs human approval.

The test `an injected instruction in a task title cannot cause a deletion`
simulates total model compromise and asserts the data survives.

---

## Reliability

- **Fallback** — provider outage, malformed output, or a throw all fall back
  to `buildFallbackPlan()` (overdue → due soon → exam → priority). Labelled
  `source: "fallback"` and surfaced in the UI as *"AI is temporarily
  unavailable. Here's a rule-based recommendation."* Never passed off as LLM
  output.
- **Honest partial results** — each item's outcome is tracked separately.
  4 of 6 succeeding reports exactly that, and the run is marked `failed`.
- **Verification** — every executed row is re-read and compared field by
  field. Unverified work produces *"We couldn't fully verify the requested
  changes…"*, never a success claim.

---

## Verification results

```
typecheck  ✓ tsc --noEmit — clean
lint       ✓ next lint — no warnings or errors
unit       ✓ 129/129 passing (70 V1 preserved + 59 V2 added)
build      ✓ next build — 14 routes, 3 new API routes
secrets    ✓ 0 occurrences of OPENAI_API_KEY in .next/static
```

Live gateway checks (demo mode):

| Request | Result |
|---|---|
| valid message, no backend | `500 config` — fails closed |
| body with `user_id` | `400 validation` — strict schema |
| 20 KB body | `413 validation` — bounded |

---

## Known limitations

1. **No cross-statement atomicity.** PostgREST offers no multi-statement
   transaction here, so items execute sequentially. This is *not* hidden —
   partial execution is tracked per item and reported honestly. A Postgres
   RPC would be the fix.
2. **Demo mode is unsupported.** V1 demo mode keeps data in browser
   localStorage; there is no server database to verify against, so the
   Copilot declines rather than pretending.
3. **In-process rate limiting.** Per-instance, not shared across replicas.
4. **RLS not exercised against live Postgres in CI.** Policies and triggers
   are in the migration; automated tests prove the application-layer
   isolation using the same port interface.
5. **Delete is registered but disabled** (`allowedAgents: []`).
6. **Intent detection is keyword-based** — deliberate, since routing decides
   which tools become reachable and must not be model-controlled.
7. **Sessions are day-granular** (V1 `planned_date` is a `date`), so
   "6:00 PM" style intra-day scheduling isn't representable yet.

---

## Not implemented (later V2 phases)

The other six agents, autonomous background agents, RAG/vector search, agent
memory, learning signals, risk events, voice, multi-agent conversation.
