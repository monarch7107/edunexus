-- ============================================================
-- EduNexus — Supabase schema (Postgres + Auth + RLS)
-- Run this in the Supabase SQL editor after creating a project.
-- ============================================================

-- ── Profiles (1:1 with auth.users) ───────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  course        text not null default '',
  branch        text not null default '',
  semester      int,
  year_of_study int,
  goals         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Subjects ─────────────────────────────────────────────────
create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  code       text not null default '',
  color      text not null default '#3b62f6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Tasks ────────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  subject_id   uuid references public.subjects (id) on delete set null,
  title        text not null,
  description  text not null default '',
  task_type    text not null default 'other'
    check (task_type in ('assignment','exam','project','reading','other')),
  priority     text not null default 'medium'
    check (priority in ('high','medium','low')),
  due_date     timestamptz,
  status       text not null default 'pending'
    check (status in ('pending','completed')),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Study sessions ───────────────────────────────────────────
create table if not exists public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  subject_id       uuid references public.subjects (id) on delete set null,
  title            text not null,
  planned_date     date not null,
  duration_minutes int not null default 30 check (duration_minutes > 0),
  status           text not null default 'planned'
    check (status in ('planned','completed')),
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Learning resources ───────────────────────────────────────
create table if not exists public.resources (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  subject_id    uuid references public.subjects (id) on delete set null,
  title         text not null,
  content       text not null default '',
  resource_url  text not null default '',
  resource_type text not null default 'note'
    check (resource_type in ('note','link')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── AI recommendations (history) ─────────────────────────────
create table if not exists public.ai_recommendations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  recommendation_type text not null default 'study_priority',
  input_snapshot      jsonb not null default '{}'::jsonb,
  output_text         text not null,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — every user can only see/touch their data
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.subjects          enable row level security;
alter table public.tasks             enable row level security;
alter table public.study_sessions    enable row level security;
alter table public.resources         enable row level security;
alter table public.ai_recommendations enable row level security;

-- profiles: a user can only read/update their own row; insert handled by trigger.
-- Drop-then-create so re-running this file is safe (idempotent), matching the
-- generic policy loop below.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- generic owner policies for the other five tables
do $$
declare t text;
begin
  foreach t in array array['subjects','tasks','study_sessions','resources','ai_recommendations']
  loop
    execute format('drop policy if exists "%1$s_all_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_all_own" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- ── Indexes for the common dashboard queries ─────────────────
create index if not exists idx_tasks_user_status   on public.tasks (user_id, status);
create index if not exists idx_tasks_user_due      on public.tasks (user_id, due_date);
create index if not exists idx_sessions_user_date  on public.study_sessions (user_id, planned_date);
create index if not exists idx_subjects_user       on public.subjects (user_id);
create index if not exists idx_resources_user      on public.resources (user_id);
