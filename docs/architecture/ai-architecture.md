# EduNexus — AI Architecture (V1 constrained + V2 agentic)

EduNexus has **two distinct AI capabilities**, deliberately separated by
endpoint, code, and safety model. Do not conflate them.

## V1 — Constrained study recommendation (`/api/recommend`)

A single, narrow feature: given the student's **real** academic snapshot
(goals, subjects, tasks, sessions, minutes studied), return a prioritized
study plan. It is **not** a chatbot.

- **Server-only.** `lib/recommendation-server.ts` is imported only by
  `app/api/recommend/route.ts` (and unit tests). The provider key, base URL
  and model (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, default
  `gpt-4o-mini`) exist only in server environment.
- **Timeouts.** Provider call ≈ 15 s (`AI_PROVIDER_TIMEOUT_MS`), client side
  ≈ 25 s (`AI_REQUEST_TIMEOUT_MS` in `lib/recommendation.ts`) — the browser
  never waits indefinitely.
- **Validation.** Snapshot is shape-validated before the provider call
  (`validateSnapshot`); the model output is shape-validated before rendering
  (`validateRecommendationResult`).
- **Deterministic fallback.** On any failure class (config, network, timeout,
  invalid output), the server returns the rule-based ranking:
  overdue → due today → nearest deadline → highest priority. Diagnostics are
  logged server-side and never leak to the browser.

## V2 — Agentic vertical slice ("Optimize my study schedule")

The first V2 agent is the **Planning Agent**. The complete, only path from
UI to mutation:

```
Student
  → Copilot / AI Command Center / Adaptive Planner UI
    → POST /api/ai  (lib/ai/client.ts)
      → AI Gateway            lib/ai/gateway.ts
          • server-derived identity (client user_id rejected: lib/ai/authorization.ts)
          • bounded request body (lib/api/body.ts → 413 before parse)
          • per-user rate limiting
      → Orchestrator          lib/ai/orchestrator.ts
          • creates agent_run, gathers AcademicContext via read tools
          • no context → honest "nothing to optimize" (never invents)
      → Planning Agent        lib/ai/agents/planning.ts
          • LLM reasons ONLY over supplied context
          • system prompt enforces: untrusted data, no invented facts,
            no self-authorization, JSON-only contract
          • plan validated against context (validatePlanAgainstContext):
            every entity_id must exist in the student's own data
          • deterministic fallback plan if the provider fails
      → Change Set            lib/ai/schemas.ts (hashChangeSet)
          • proposal_hash binds approval to the exact proposal
          • edit ⇒ new hash ⇒ previous approval invalidated
      → Student approval      /api/ai/approve   (lib/ai/approvals.ts)
          • Approve / Reject / Edit (edit re-enters the proposal flow)
      → Execution             lib/ai/tools/registry.ts + tools/sessions.ts
          • tool allowlists per agent; read tools free, write tools gated
          • mutation_id per item; idempotency ledger + unique DB constraint
          • durable writes: lib/ai/persist.ts
              supabase mode → authenticated server client (RLS re-filters)
              demo mode     → process-memory store (honestly labeled)
      → Verification          lib/ai/verification.ts
          • rereads the durable store; success = actual state matches
      → Result + activity     /ai (run), /ai/activity (history), /ai/approvals
          • audit persisted: agent_runs, agent_actions, change_sets,
            change_items, agent_approvals
```

### Tool surface (deliberately small)

| Tool | Kind | Approval |
| --- | --- | --- |
| `getSubjects`, `getTasks`, `getStudySessions` | read | none |
| `createStudySession`, `updateStudySession`, `deleteStudySession` | write | required (Change Set) |

There is **no** generic "write anything" tool, **no** SQL tool, **no**
self-authorization, **no** other agents in the implemented slice. Conceptual
future agents (Task / Learning / Revision / Resource / Insight / Academic
Risk) are design intent only — none are implemented.

### Failure classification

Every V2 failure carries an `AiError` class (`lib/ai/errors.ts`): `auth`,
`permission`, `validation`, `rate-limit`, `provider`, `timeout`,
`integrity`… The UI shows a stable, human-readable state for each; raw
provider errors never reach the browser.

## What the AI may never do

- read or write as another user (identity is server-derived; RLS is the gate)
- access the database directly (only the five tools above)
- invent academic facts (plans are validated against the gathered context)
- mutate data without an approved, hash-bound Change Set
- execute a mutation twice (mutation idempotency)
- run in the browser (all V2 logic is server-side; `lib/ai/client.ts` is a
  thin typed fetch wrapper)
