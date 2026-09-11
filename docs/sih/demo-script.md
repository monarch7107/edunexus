# EduNexus — Judge Demo Script

A 5–8 minute demonstration, designed for the venue network (demo mode is the
primary, zero-infrastructure path; hosted Supabase is the stretch path —
smoke-test it on venue Wi-Fi if you go live).

> Recommended posture: **demo mode first** (register a fresh account — no
> credentials, no network dependency beyond the app itself). If a hosted
> Supabase demo is preferred, confirm email-confirmation is **off** in
> Supabase Auth and that the venue network can reach `*.supabase.co`.

## Setup (before judges arrive)

1. `npm install && npm run build && npm run start` — or use the deployed
   Vercel URL `https://edunexus-pied.vercel.app` if reachable on venue
   network.
2. Have the four themes visible (theme picker in the sidebar / profile →
   appearance): **Sapphire (default) → Royal → Neon → Aurora**, light/dark.
3. Have a prepared account with a sample workspace loaded ("Load sample
   workspace" on an empty dashboard — clearly labeled demo data).

## The journey (the exact product path)

1. **Landing** — one line: "Everything a student needs for managing and
   improving their education, in one place." Point at the problem: fragmented
   academic life (tasks, deadlines, study, resources, progress in different
   places).
2. **Register → Onboarding** — name, course, branch, semester, goals.
   Mention: onboarding is validated (blank/whitespace fields are rejected).
3. **Dashboard** — the flagship: greeting, priority tasks, overdue, today's
   sessions, progress, quick actions, insights, AI entry points. Load the
   sample workspace; note the honest "Sample workspace — demo data" banner.
4. **Academics** — create a subject and a task with deadline/priority;
   complete it. One line on the deadline rules (past dates allowed; timezone-
   safe; exact timestamps preserved on edit).
5. **Planner** — sessions by day, weekly view; add a session; note conflict
   detection.
6. **Learning & Resources** — notes and links per subject, search; mention
   the honest file-upload boundary ("selected locally, not uploaded" — no
   fake progress).
7. **Insights & Risk** — deterministic signals: completion, overdue, 7-day
   study chart, workload estimate (manageable/heavy/overloaded) with
   evidence. One line: "rule-based and evidence-grounded — no fake ML."
8. **AI Command Center — the V2 moment.** Ask: *"Optimize my study
   schedule."*
   - The UI shows the run: context gathered → Planning Agent reasoning →
     proposed **Change Set** (create/move sessions, adjust priorities).
   - **Edit** the proposal (move a session one day) → the approval is
     invalidated → re-approve. (This is the headline: *the AI cannot mutate
     without my approval, and editing resets trust.*)
   - **Approve** → execution → **verification** (rereads the database) →
     result explained.
   - **Activity history** shows the run end-to-end.
9. **Security in one sentence each** (if asked):
   - "The LLM can reason; it cannot authorize itself. Server identity, tool
     allowlists, proposal hashes, mutation idempotency, verification rereads."
   - "Every table is RLS-protected: `auth.uid() = user_id`. The anon key is
     public by design; RLS is the gate."
   - "AI keys are server-only. The browser only ever sends the student's own
     snapshot."
   - "Offline: we queue only safe task/session mutations, isolated per
     account, and we never cache private API responses."
10. **Close** — V1 is the reliable workspace; V2 is safe intelligence on top
    of it; the same repository contract runs with zero infrastructure or on
    real Postgres.

## Failure-recovery lines (playbook)

- AI provider down / no key → deterministic fallback plan, labeled as such.
- Backend read fails → per-dataset "stale" warning + retry, never silent.
- Switch accounts → queues, history, and data stay isolated (demonstrate in
  demo mode: two tabs, two accounts).
- Hosted Supabase unreachable → "demo mode is the full product; hosted mode
  adds Postgres + RLS persistence — verified with real-Postgres RLS tests in
  this repo (`npm run test:rls`)."
