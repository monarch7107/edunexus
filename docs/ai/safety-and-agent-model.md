# EduNexus — AI Safety & Agent Model

## The absolute security principle

> **The LLM can reason. It cannot authorize itself.**

Every layer below the UI is server-side, and the model sits inside that
server with a very small, fixed toolbox. The model never sees credentials,
never touches the database, never decides its own permissions, and never
mutates anything without the student's explicit, hash-bound approval.

## The agent model

```
Agent = Context + Reasoning + Planning + Tools + Verification + Controlled autonomy
```

The implemented agent is the **Planning Agent** (one vertical slice:
"Optimize my study schedule"). The other six conceptual agents (Task,
Learning, Revision, Resource, Insight, Academic Risk) are design intent and
are **not implemented** — they are named in design docs only.

## Controls, layer by layer

| Layer | Control | Where |
| --- | --- | --- |
| Identity | server-derived from session (or demo cookie); **client-supplied `user_id` rejected** at the gateway | `lib/ai/authorization.ts`, API routes |
| Transport | bounded JSON bodies (413 before parse; chunked-transfer safe); per-user rate limiting | `lib/api/body.ts`, `lib/ai/gateway.ts` |
| Context | agent receives only the student's own rows, gathered by authorized read tools; empty context → honest refusal, never invention | `lib/ai/orchestrator.ts` |
| Reasoning | system prompt: academic content is **untrusted data**; no invented facts/IDs; JSON-only output contract | `lib/ai/agents/planning.ts` |
| Plan validation | every proposed `entity_id` must exist in the student's own context; operations restricted to the allowed set; output limits enforced | `lib/ai/agents/planning.ts`, `lib/ai/schemas.ts` |
| Proposal integrity | `proposal_hash` over the exact change set; **editing invalidates the previous approval** (new hash, new approval) | `lib/ai/schemas.ts`, `lib/ai/approvals.ts` |
| Authorization | tool allowlists per agent type; read tools free, write tools require an executable, hash-matching, owner-matching approval | `lib/ai/authorization.ts` |
| Execution | only five tools exist; writes go through the durable repository (Supabase mode: authenticated server client, RLS re-filters every statement) | `lib/ai/tools/*`, `lib/ai/persist.ts` |
| Idempotency | deterministic `mutation_id` per item; in-process ledger + **unique DB constraint `(user_id, mutation_id)`** — replays/double-clicks/agent retries cannot double-execute | `lib/ai/schemas.ts`, `supabase/v2_agentic_step20.sql` |
| Verification | after execution, each item is **reread from the durable store**; verified state is reported, not assumed | `lib/ai/verification.ts` |
| Audit | every run/action/approval persisted to the V2 audit tables (durable in Supabase mode) | `lib/ai/audit-persist.ts` |
| Prompt injection | academic content is treated as data, not instructions; the agent has no instruction-following surface beyond the fixed JSON contract; injected text cannot unlock tools, because tools are authorized server-side regardless of model output | `lib/ai/agents/planning.ts`, `lib/ai/authorization.ts` |
| Account isolation | all reads/writes filtered by server-side `user_id`; demo-mode stores keyed per user id; offline queue isolated per account | `lib/ai/*`, `lib/offline/queue.ts` |
| Provider failure | classified failure (`AiError` classes) + deterministic fallback plan; raw provider errors never reach the browser | `lib/ai/errors.ts`, `lib/ai/fallback.ts` |

## Approvals: Approve / Edit / Reject

- **Reject** — the run is recorded, nothing is mutated, the UI says so.
- **Edit** — the student adjusts the proposal (move dates, drop items); the
  hash changes; the new proposal must be re-approved.
- **Approve** — only then does execution run, item by item, then
  verification rereads the durable state and explains the actual result.

## V1 AI (constrained recommendation) safety

Same philosophy, simpler surface: server-only key, snapshot shape-validation
in and out, ~15 s provider timeout, ~25 s client timeout, deterministic
rule-based fallback (overdue → due today → nearest deadline → highest
priority). The prompt uses **only** the supplied snapshot data.

## Honest capability statement

EduNexus AI is an academic-planning aid with one implemented agent and a
five-tool surface. It is not a general-purpose assistant, not a chatbot, and
not an autonomous agent system. It honestly reports when it is unavailable
(offline, provider down) and always falls back to deterministic behavior.
