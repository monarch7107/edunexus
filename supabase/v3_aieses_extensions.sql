-- ============================================================
-- AIESES V3 — Academic Extensions (Additive Migration)
-- Preserves all V1 & V2 tables, rows, and RLS policies.
-- ============================================================

-- Add optional role column to profiles if not exists
alter table public.profiles add column if not exists role text not null default 'student'
  check (role in ('student', 'teacher', 'admin'));

-- ── Student Creation Workspace Documents ─────────────────────
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null default 'Untitled Document',
  content      text not null default '',
  project_name text not null default 'General',
  subject_id   uuid references public.subjects (id) on delete set null,
  language     text not null default 'markdown',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Teacher Classes ──────────────────────────────────────────
create table if not exists public.teacher_classes (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references auth.users (id) on delete cascade,
  code         text not null,
  name         text not null,
  semester     text not null default '',
  created_at   timestamptz not null default now()
);

-- ── Course Assessments ───────────────────────────────────────
create table if not exists public.assessments (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid references public.subjects (id) on delete set null,
  class_code   text not null default '',
  title        text not null,
  description  text not null default '',
  total_marks  int not null default 100,
  due_date     timestamptz,
  questions    jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

-- ── Student Submissions ──────────────────────────────────────
create table if not exists public.assessment_submissions (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  answers       jsonb not null default '{}'::jsonb,
  score         int not null default 0,
  feedback      text not null default '',
  status        text not null default 'submitted'
    check (status in ('submitted', 'graded', 'pending_review')),
  submitted_at  timestamptz not null default now()
);

alter table public.documents              enable row level security;
alter table public.teacher_classes        enable row level security;
alter table public.assessments            enable row level security;
alter table public.assessment_submissions enable row level security;

-- Documents: user owns their own documents
drop policy if exists "documents_own" on public.documents;
create policy "documents_own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Teacher classes: teacher owns their classes
drop policy if exists "teacher_classes_own" on public.teacher_classes;
create policy "teacher_classes_own" on public.teacher_classes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- Assessments: authenticated users can read assessments
drop policy if exists "assessments_read" on public.assessments;
create policy "assessments_read" on public.assessments
  for select using (auth.role() = 'authenticated');

-- Submissions: students own their submissions
drop policy if exists "submissions_own" on public.assessment_submissions;
create policy "submissions_own" on public.assessment_submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_documents_user on public.documents (user_id, updated_at desc);
create index if not exists idx_teacher_classes_teacher on public.teacher_classes (teacher_id);
create index if not exists idx_assessment_submissions_user on public.assessment_submissions (user_id);
