-- ============================================================
-- EduNexus V2 — Agentic AI (first vertical slice)
-- Adds the audit / approval tables for controlled agentic writes.
--
-- V1 tables (profiles, subjects, tasks, study_sessions, resources,
-- ai_recommendations) are NOT modified by this migration.
--
-- Security model: every table is user-owned and protected by RLS with
-- `auth.uid() = user_id`. The authenticated session is the only source of
-- identity — a user_id supplied by a browser, a model, or a tool call can
-- never widen access, because the policies ignore it entirely.
-- ============================================================

-- ── agent_runs — one AI/agent execution ──────────────────────
create table if not exists public.agent_runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  agent_type     text not null default 'planning'
    check (agent_type in ('planning')),
  intent         text not null
    check (intent in ('optimize_schedule')),
  status         text not null default 'queued'
    check (status in ('queued','running','waiting_approval','executing',
                      'completed','failed','cancelled')),
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  error_class    text,
  -- Bounded, non-sensitive summaries only. Never store raw prompts.
  input_summary  text not null default '',
  output_summary text not null default '',
  metadata       jsonb not null default '{}'::jsonb,
  request_id     text not null default ''
);

-- ── agent_actions — audit of every tool invocation ───────────
create table if not exists public.agent_actions (
  id                uuid primary key default gen_random_uuid(),
  agent_run_id      uuid not null references public.agent_runs (id) on delete cascade,
  user_id           uuid not null references auth.users (id) on delete cascade,
  agent_type        text not null default 'planning',
  tool_name         text not null,
  action_type       text not null
    check (action_type in ('read','create','update','delete','move')),
  target_type       text not null default '',
  target_id         uuid,
  input_summary     text not null default '',
  status            text not null default 'pending'
    check (status in ('pending','approved','executed','verified',
                      'failed','rejected','skipped')),
  requires_approval boolean not null default false,
  approved_at       timestamptz,
  executed_at       timestamptz,
  verified_at       timestamptz,
  error_class       text,
  created_at        timestamptz not null default now()
);

-- ── change_sets — a group of proposed modifications ──────────
create table if not exists public.change_sets (
  id           uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null default '',
  reason       text not null default '',
  status       text not null default 'pending'
    check (status in ('pending','approved','partially_approved','rejected',
                      'expired','executed','verified','failed')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '15 minutes')
);

-- ── change_items — individual proposed changes ───────────────
create table if not exists public.change_items (
  id             uuid primary key default gen_random_uuid(),
  change_set_id  uuid not null references public.change_sets (id) on delete cascade,
  -- Denormalized for a simple, index-friendly RLS predicate.
  user_id        uuid not null references auth.users (id) on delete cascade,
  operation      text not null
    check (operation in ('create','update','delete','move')),
  entity_type    text not null
    check (entity_type in ('study_session')),
  entity_id      uuid,
  payload        jsonb not null default '{}'::jsonb,
  previous_state jsonb,
  status         text not null default 'pending'
    check (status in ('pending','approved','executed','verified',
                      'failed','rejected','skipped')),
  error          text,
  label          text not null default '',
  detail         text not null default '',
  reason         text not null default '',
  created_at     timestamptz not null default now()
);

-- ── agent_approvals — the explicit student decision ──────────
create table if not exists public.agent_approvals (
  id                 uuid primary key default gen_random_uuid(),
  agent_run_id       uuid not null references public.agent_runs (id) on delete cascade,
  change_set_id      uuid not null references public.change_sets (id) on delete cascade,
  user_id            uuid not null references auth.users (id) on delete cascade,
  status             text not null default 'pending'
    check (status in ('pending','approved','partially_approved',
                      'rejected','expired')),
  reviewed_at        timestamptz,
  expires_at         timestamptz not null default (now() + interval '15 minutes'),
  -- Hash of the change-set contents at approval time. Any later edit
  -- changes this, which invalidates a stale approval at execution.
  change_fingerprint text not null default '',
  created_at         timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — auth.uid() = user_id on every table
-- ============================================================
alter table public.agent_runs      enable row level security;
alter table public.agent_actions   enable row level security;
alter table public.change_sets     enable row level security;
alter table public.change_items    enable row level security;
alter table public.agent_approvals enable row level security;

do $$
declare t text;
begin
  foreach t in array array['agent_runs','agent_actions','change_sets',
                           'change_items','agent_approvals']
  loop
    execute format('drop policy if exists "%1$s_all_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_all_own" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- ============================================================
-- Referential integrity across owners
--
-- RLS alone would let a (buggy) client attach a change_item to a
-- change_set it cannot see. These triggers make cross-user linkage
-- impossible at the database level.
-- ============================================================
create or replace function public.assert_same_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  parent_owner uuid;
begin
  if tg_table_name = 'agent_actions' or tg_table_name = 'change_sets' then
    select user_id into parent_owner from public.agent_runs where id = new.agent_run_id;
  elsif tg_table_name = 'change_items' then
    select user_id into parent_owner from public.change_sets where id = new.change_set_id;
  elsif tg_table_name = 'agent_approvals' then
    select user_id into parent_owner from public.change_sets where id = new.change_set_id;
  end if;

  if parent_owner is null or parent_owner <> new.user_id then
    raise exception 'ownership mismatch: row owner does not match parent owner'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists agent_actions_same_owner on public.agent_actions;
create trigger agent_actions_same_owner
  before insert or update on public.agent_actions
  for each row execute function public.assert_same_owner();

drop trigger if exists change_sets_same_owner on public.change_sets;
create trigger change_sets_same_owner
  before insert or update on public.change_sets
  for each row execute function public.assert_same_owner();

drop trigger if exists change_items_same_owner on public.change_items;
create trigger change_items_same_owner
  before insert or update on public.change_items
  for each row execute function public.assert_same_owner();

drop trigger if exists agent_approvals_same_owner on public.agent_approvals;
create trigger agent_approvals_same_owner
  before insert or update on public.agent_approvals
  for each row execute function public.assert_same_owner();

-- ============================================================
-- Indexes for the agent activity views
-- ============================================================
create index if not exists idx_agent_runs_user_started
  on public.agent_runs (user_id, started_at desc);
create index if not exists idx_agent_actions_user_run
  on public.agent_actions (user_id, agent_run_id);
create index if not exists idx_change_sets_user_run
  on public.change_sets (user_id, agent_run_id);
create index if not exists idx_change_items_user_set
  on public.change_items (user_id, change_set_id);
create index if not exists idx_agent_approvals_user_set
  on public.agent_approvals (user_id, change_set_id, created_at desc);
