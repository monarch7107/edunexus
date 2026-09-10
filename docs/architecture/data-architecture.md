# EduNexus — Data Architecture

## Database

PostgreSQL via **Supabase** (Auth + Postgres + Row Level Security). Single
project: `ohuyargnnzasdfjbffva` (ap-northeast-1) —
`https://ohuyargnnzasdfjbffva.supabase.co`.

> The project `ossgcgnsmftbymwtyvpn` is a **different, incorrect** project
> that was used by mistake early in development. It must never be used for
> EduNexus.

## Schema

### V1 tables (user-owned: `user_id` → `auth.users`)

| Table | Purpose |
| --- | --- |
| `profiles` | 1:1 with `auth.users` (auto-created by trigger `on_auth_user_created` → `handle_new_user()`): name, course, branch, semester, year, goals |
| `subjects` | name, code, color |
| `tasks` | title, description, task_type, priority, `due_date` (timestamptz), status; FK → subjects (`ON DELETE SET NULL`) |
| `study_sessions` | subject, `planned_date`, duration, status |
| `resources` | notes and links per subject |
| `ai_recommendations` | best-effort history of V1 recommendations |

### V2 audit tables (all user-owned)

| Table | Purpose |
| --- | --- |
| `agent_runs` | one row per agent invocation (type, intent, status lifecycle, error class, summaries) |
| `agent_actions` | one row per tool action (tool, read/write, target, approval/execute/verify timestamps) |
| `change_sets` | the proposed plan (items, `proposal_hash`) |
| `change_items` | individual mutations (`mutation_id`, operation, entity, payload) |
| `agent_approvals` | student decisions; approval validity is bound to `proposal_hash` |

### RLS principle

Every table has Row Level Security **enabled** with owner policies:

```
auth.uid() = user_id
```

No table is readable/writable by anon. The anon key is public by design —
RLS is the gate. The service-role key is never used or referenced anywhere
in this repository.

The `handle_new_user()` trigger function is `SECURITY DEFINER`
(`SET search_path = public`) — this is the standard Supabase pattern and is
one of the advisor warnings documented honestly in `docs/security/security.md`.

## Migrations (applied, idempotent, in order)

Do **not** rewrite already-applied migrations; their history is
infrastructure. The "step" names are historical (they record the development
sequence that produced them).

| # | File | Contents |
| --- | --- | --- |
| 1 | `supabase/schema.sql` | V1 tables, auto-profile trigger, indexes, RLS policies |
| 2 | `supabase/v2_agentic.sql` | V2 audit tables + owner RLS policies |
| 3 | `supabase/v2_agentic_step19.sql` | adds `proposal_hash` (change_sets) + `mutation_id` (change_items) |
| 4 | `supabase/v2_agentic_step20.sql` | **unique** index on `(user_id, mutation_id)` — the idempotency constraint |

Every file is re-runnable (the migration idempotency test applies all of
them **twice** to a real PostgreSQL engine — see `docs/testing/testing.md`).
All four have been applied to the hosted project.

## Persistence modes

| Concern | Supabase mode | Demo mode |
| --- | --- | --- |
| V1 data | Postgres + RLS | localStorage (labeled "sample/local") |
| V2 audit | durable tables above | process-memory store, explicitly **not** described as durable |
| Verification | rereads the database | rereads the same in-process store |

Demo mode exists so the product runs with **zero infrastructure**; it is
always visibly labeled in the UI, and the offline/agent code paths refuse to
describe demo persistence as production persistence.

## Client data layer

`lib/repo` is the single contract (see `lib/repo/types.ts`): auth, profile,
subjects, tasks, sessions, resources, recommendation history — implemented by
`SupabaseRepo` and `DemoRepo`. `lib/workspace-refresh.ts` makes refreshes
race-safe (monotonic sequence tokens, per-dataset settlement, per-dataset
failure reporting) so one stale or failed read can never corrupt newer state.
`lib/errors.ts` converts categorized `RepoError`s into friendly UI copy.
