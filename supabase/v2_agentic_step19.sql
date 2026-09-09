-- ============================================================
-- EduNexus V2 Step 19 — additive durability helpers
-- Additive only. Existing tables and rows are preserved.
-- ============================================================

alter table public.change_sets
  add column if not exists proposal_hash text not null default '';

alter table public.agent_actions
  add column if not exists mutation_id text;

create index if not exists idx_agent_actions_mutation
  on public.agent_actions (user_id, mutation_id)
  where mutation_id is not null;
