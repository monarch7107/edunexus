# Smart India Hackathon 2026 — Problem Statement

**Event:** Smart India Hackathon 2026
**Problem Statement ID:** `26207` *(authoritative identifier)*
**Organization:** AICTE
**Department:** AICTE, MIC – Student Innovation
**Category:** Software
**Theme:** Smart Education

## Official wording

> "Student Innovation – Smart education, a concept that describes learning in
> digital age. It enables learners to learn more effectively, efficiently,
> flexibly and comfortably."

## How EduNexus maps to the problem statement

| Official characteristic | EduNexus capability |
| --- | --- |
| **Effectively** | Structured academic context (subjects → tasks → deadlines → study sessions → resources) with deterministic academic signals (workload, overdue, exam load, subject attention) and a constrained AI study recommendation that uses the student's real data — plus the V2 Planning Agent that proposes concrete schedule changes with evidence, for the student to approve |
| **Efficiently** | One workspace instead of scattered notes: unified dashboard, task deadlines/priorities, study-time tracking, insights, workspace search; race-safe refresh so the data you see is the data you have |
| **Flexibly** | Runs with zero infrastructure (demo mode) or full Postgres+RLS (Supabase mode); PWA/offline foundation with honest capability reporting; four visual identities + light/dark to fit the learner; responsive from 320 px phones to large displays |
| **Comfortably** | Premium, calm design system (semantic tokens, AA contrast, reduced-motion support), friendly error language, clearly-labeled sample data, AI that explains what it will change and why before touching anything |

## Scope discipline (what EduNexus intentionally is NOT)

To stay focused on the problem statement, the following are explicitly out
of scope and must not be reintroduced as features:

- generic chatbot / generic AI tutor / "upload a PDF and ask questions"
- teacher or parent dashboards, real-time collaboration, gamification,
  blockchain, voice AI, multilingual AI
- full LMS replacement, calendar integrations, complex notification systems
- advanced predictive analytics, autonomous multi-agent systems
- microservices, separate inference services (the Python research package
  stays research; FastAPI is deferred by decision)
- full offline-first private-page app (the offline foundation covers queued
  task/session mutations and honest public-shell caching — see
  `docs/architecture/architecture.md`)

## Separation of record

Per the project's documentation policy, four kinds of statements are kept
distinct everywhere in this repository:

1. **Official SIH information** — this file (and only this) quotes the
   problem statement.
2. **EduNexus product decisions** — `README.md`, `docs/sih/technical-summary.md`.
3. **Engineering assumptions** — `docs/architecture/*`, `docs/security/security.md`.
4. **Experimental research** — `python/` (synthetic-data ML experiments,
   clearly labeled, never presented as production).
