-- ============================================================
-- EduNexus V2 — Agentic AI (first vertical slice)
-- Additive only. Does not replace V1 tables.
-- ============================================================

create table if not exists public.agent_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  agent_type      text not null default 'planning',
  intent          text not null default 'optimize_schedule',
  status          text not null default 'queued'
    check (status in ('queued','running','waiting_approval','executing','completed','failed','cancelled')),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  error_class     text,
  input_summary   text not null default '',
  output_summary  text not null default '',
  metadata        jsonb not null default '{}'::jsonb,
  request_id      text,
  created_at      timestamptz not null default now()
);

create table if not exists public.agent_actions (
  id                uuid primary key default gen_random_uuid(),
  agent_run_id      uuid not null references public.agent_runs (id) on delete cascade,
  user_id           uuid not null references auth.users (id) on delete cascade,
  agent_type        text not null default 'planning',
  tool_name         text not null,
  action_type       text not null default 'read',
  target_type       text,
  target_id         text,
  input_summary     text not null default '',
  status            text not null default 'pending'
    check (status in ('pending','approved','executed','verified','rejected','failed')),
  requires_approval boolean not null default false,
  approved_at       timestamptz,
  executed_at       timestamptz,
  verified_at       timestamptz,
  error_class       text,
  created_at        timestamptz not null default now()
);

create table if not exists public.change_sets (
  id            uuid primary key default gen_random_uuid(),
  agent_run_id  uuid not null references public.agent_runs (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  reason        text not null default '',
  status        text not null default 'pending'
    check (status in ('pending','approved','partially_approved','rejected','expired','executed','verified','failed')),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz
);

create table if not exists public.change_items (
  id              uuid primary key default gen_random_uuid(),
  change_set_id   uuid not null references public.change_sets (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  operation       text not null
    check (operation in ('create','update','delete','move')),
  entity_type     text not null,
  entity_id       text,
  payload         jsonb not null default '{}'::jsonb,
  previous_state  jsonb,
  status          text not null default 'pending',
  error           text
);

create table if not exists public.agent_approvals (
  id              uuid primary key default gen_random_uuid(),
  agent_run_id    uuid not null references public.agent_runs (id) on delete cascade,
  change_set_id   uuid not null references public.change_sets (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  status          text not null default 'pending'
    check (status in ('pending','approved','partially_approved','rejected','expired')),
  reviewed_at     timestamptz,
  expires_at      timestamptz,
  change_set_hash text not null default '',
  created_at      timestamptz not null default now()
);

alter table public.agent_runs      enable row level security;
alter table public.agent_actions   enable row level security;
alter table public.change_sets     enable row level security;
alter table public.change_items    enable row level security;
alter table public.agent_approvals enable row level security;

do $$
declare t text;
begin
  foreach t in array array['agent_runs','agent_actions','change_sets','change_items','agent_approvals']
  loop
    execute format('drop policy if exists "%1$s_all_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_all_own" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

create index if not exists idx_agent_runs_user on public.agent_runs (user_id, started_at desc);
create index if not exists idx_change_sets_user on public.change_sets (user_id, created_at desc);
create index if not exists idx_change_items_set on public.change_items (change_set_id);
create index if not exists idx_agent_approvals_user on public.agent_approvals (user_id);
