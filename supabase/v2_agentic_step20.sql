-- ============================================================
-- EduNexus V2 Step 20 — execution idempotency ledger
-- Additive only. Existing tables and rows are preserved.
-- ============================================================

-- Each change item gets a deterministic mutation_id (set id + item id hash).
-- This partial unique index makes the agent_actions table the authoritative
-- idempotency ledger: a repeated approval/execution of the same item is
-- visible across restarts and instances, and can never insert a duplicate
-- study session because the deduplication check reads this row first.
create unique index if not exists idx_agent_actions_mutation_unique
  on public.agent_actions (user_id, mutation_id)
  where mutation_id is not null;

-- Faster status transitions for the execution loop.
create index if not exists idx_agent_actions_set_run
  on public.agent_actions (agent_run_id, status);
