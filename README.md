# AIESES

> **AI-Enabled Integrated Smart Education System**  
> *Smart India Hackathon 2026 · Problem Statement ID: 26207 · Theme: Smart Education · Team: Vision Forge*

---

## 1. Project Overview

**AIESES** (AI-Enabled Integrated Smart Education System) is an integrated, adaptive educational platform developed by **Team Vision Forge** for SIH 2026 (Problem Statement 26207: *Smart Education*). 

Built on the hardened foundation of the EduNexus codebase, AIESES unifies the entire learning lifecycle:
1. **Core Learning**: Unified subjects, tasks with priorities and deadlines, study session scheduler, learning library, and real-time progress insights.
2. **EduAdapt**: Rule-based knowledge diagnostics that evaluate student performance, assessment scores, and study deficits to detect weak skills and recommend targeted learning interventions.
3. **AI Pedagogical Layer**: Six structured tutoring modes (Q&A, Conceptual Explanation, ELI5 Simplicity, Step-by-Step Examples, Active Practice Challenges, Action Recommendations) with guaranteed server-side deterministic fallbacks so the system never breaks.
4. **Government Content Integration**: DIKSHA Sunbird curriculum gateway connecting official NCERT, CBSE, and State Board open educational resources (CC-BY-NC-SA 4.0) with verifiable attribution.
5. **Multilingual / Vernacular Learning**: Native translation abstraction and language switcher supporting English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), and Bengali (বাংলা).
6. **Student Creation Workspace & IDE**: Markdown document studio, project documentation notes, client-side PDF / print export engine, and a secure isolated code runner for JavaScript and Python (zero server code execution).
7. **Educator & Teacher Portal**: Comprehensive cohort monitoring, class progress rosters, assessment management, submission grading, and class-wide weak area clustering.

---

## 2. Architecture Target & Conceptual Organization

```text
AIESES
│
├── Core Learning
│   ├── Learning Resources & Personal Library (/learning)
│   ├── Discovery & Curriculum Navigation (/learning/diksha)
│   ├── Student Dashboard (/dashboard)
│   ├── Teacher Dashboard & Cohort Monitoring (/teacher)
│   ├── Assessments & Practice Quizzes (/assessments)
│   ├── Progress Tracking & Insights (/insights)
│   └── Workload & Academic Signals (/risk)
│
├── EduAdapt
│   ├── Learner Profile & Goals (/profile, /onboarding)
│   ├── Skill Mapping (Foundations, Core Theory, Practical, Advanced)
│   ├── Weak Area Detection Engine (lib/eduadapt/index.ts)
│   └── Targeted Practice Recommendations
│
├── AI Layer
│   ├── Planning Agent / Schedule Copilot (/ai)
│   ├── Approval Center & Auditing (/ai/approvals, /ai/activity)
│   ├── AI Pedagogical Tutor (/ai/tutor, /api/ai/tutor)
│   └── Deterministic Offline & Local Fallbacks
│
├── Government Content
│   └── DIKSHA Sunbird Gateway (lib/government/diksha.ts, /learning/diksha)
│
├── Multilingual / Vernacular
│   ├── Language Selection (components/theme/language-picker.tsx)
│   ├── Translation Abstraction (lib/i18n/languages.ts)
│   └── Vernacular Learning Support (EN, HI, TA, TE, MR, BN)
│
└── Student Creation Workspace
    ├── Document & Notes Studio (/workspace)
    ├── Markdown Editor with Live Split-Preview
    ├── PDF Export / Formatted Print Engine
    ├── Isolated Client-Side JavaScript Runner
    └── Simulated Python Algorithmic Runner
```

---

## 3. Technology Stack

- **Frontend & Full Stack Framework**: Next.js 14.2.35 (App Router) + React 18.3.1 + TypeScript 5.6.2
- **Styling & Design System**: Tailwind CSS 3.4.11 + Framer Motion 11.18.2 (with strict `prefers-reduced-motion` compliance)
- **Typography & Theming**: DM Sans + Manrope variable fonts, 4 selectable palettes (*Sapphire Blue*, *Royal Gold*, *Neon*, *Aurora Scholar*) × light/dark modes with WCAG AA contrast compliance
- **Database & Security**: PostgreSQL + Supabase (Auth + Row Level Security policies), PGlite 0.2.17 (in-memory WASM PostgreSQL 16 for testing RLS)
- **Repository Pattern**: Unified dual-mode store (`lib/repo/`) supporting zero-config local browser `localStorage` demo mode and production Supabase backend
- **AI Integration**: OpenAI-compatible Chat Completions API (server-side only) with instant, labeled deterministic fallbacks
- **Testing**: Vitest 2.1.9 (22 test suites, 172 tests passing), PGlite RLS certification, Next.js typecheck, ESLint

---

## 4. Setup Instructions & Local Development

### Prerequisites
- Node.js >= 18.18.0 (tested on v22.22.3)
- npm >= 9.0.0 (tested on 10.9.8)

### Installation
```bash
# Clone the repository
git clone https://github.com/monarch7107/edunexus.git
cd edunexus

# Install dependencies
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (leave empty for zero-setup local demo mode) | Unset |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key | Unset |
| `OPENAI_API_KEY` | Optional OpenAI key for live AI Tutor & Copilot reasoning | Unset (uses deterministic fallback) |
| `OPENAI_BASE_URL` | OpenAI API Base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | LLM Model Identifier | `gpt-4o-mini` |
| `DIKSHA_SUNBIRD_API_URL` | DIKSHA Sunbird Gateway Endpoint | Unset (uses certified NCERT provider) |

### Running the Application
```bash
# Development server (bound to 0.0.0.0:3000)
npm run dev

# Production build & start
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Testing & Verification Evidence

All tests pass without errors:

```bash
# Run unit & security test suite (172 tests across 22 suites)
npm run test:unit

# Run TypeScript static type checking
npm run typecheck

# Run Next.js code linting
npm run lint

# Run real PostgreSQL 16 RLS security tests (via PGlite WASM)
npm run test:rls
```

### Test Results Summary
- `tests/security/rls-postgres.test.ts`: PASS (11 tests — real PostgreSQL RLS isolation)
- `tests/security/rls-aieses.test.ts`: PASS (2 tests — documents & assessment submissions isolation)
- `tests/security/migration-idempotency.test.ts`: PASS (3 tests)
- `tests/unit/diksha.test.ts`: PASS (4 tests — NCERT attribution, filtering, metadata)
- `tests/unit/tutor.test.ts`: PASS (4 tests — 6 tutoring modes, fallback reliability)
- `tests/unit/eduadapt.test.ts`: PASS (2 tests — weak area diagnosis & action generation)
- `tests/unit/runner.test.ts`: PASS (3 tests — JS sandbox & Python simulated runner)
- `tests/unit/v2-agentic.test.ts`: PASS (29 tests — safe planning agent & changeset approval)
- `tests/unit/recommendation-reliability.test.ts`: PASS (21 tests)
- `tests/unit/theme.test.ts`: PASS (9 tests)
- **Total Vitest Tests**: **172 Passed, 0 Failed, 22 Test Suites**.

---

## 6. Security Model & Honest Capability Boundaries

1. **Client Code Execution (Rule 8 Compliance)**:
   Arbitrary student code is **NEVER executed on the server**. JavaScript is evaluated inside an isolated, restricted client-side sandbox with a 1500ms safety timeout and output truncation. Python is evaluated via an isolated client-side interpreter simulation.
2. **AI Reasoning Without Self-Authorization**:
   The Planning Agent can propose schedule mutations as an unexecuted Change Set. Changes require explicit student review: **Approve / Edit / Reject**. Execution only proceeds post-approval, and success is verified by rereading the persistent database.
3. **Database RLS Policies**:
   Every database row (`subjects`, `tasks`, `study_sessions`, `resources`, `documents`, `submissions`, `agent_runs`) is secured with PostgreSQL Row Level Security (`auth.uid() = user_id`). Users can never access or mutate rows belonging to another student.
4. **Offline Capability & Demo Mode**:
   When no backend or API keys are configured, AIESES runs in local demo mode (`localStorage`), remaining 100% clickable, fully functional, and reload-safe.

---

## 7. Judge Demo Walkthrough (SIH 2026 Script)

### Step 1: Student Onboarding & Dashboard (1 min)
1. Navigate to `/register` or `/login`. Log in to the demo workspace.
2. The **AIESES Dashboard** (`/dashboard`) surfaces academic stats: active subjects, pending assignments, overdue tasks, upcoming exams, and scheduled study sessions.
3. Click **"Generate my study plan"** in the AIESES AI card: transparent rules prioritize overdue tasks and near-term exams.

### Step 2: Adaptive Weak Area Detection & AI Tutor (1.5 min)
1. Open **Academic Risk** (`/risk`): EduAdapt analyzes overdue items and study deficits to flag at-risk subject areas (e.g. *Calculus Limits* or *Binary Search Trees*).
2. Click **"Ask AI Tutor to Explain"** (`/ai/tutor`): Choose between 6 modes (*Explain Concept*, *Explain Simply*, *Give Example*, *Practice Challenge*, *Q&A*, *Recommend Action*).
3. Experience the clear, structured explanation with suggested follow-up learning actions.

### Step 3: DIKSHA Curriculum & Knowledge Assessment (1.5 min)
1. Open **DIKSHA Gateway** (`/learning/diksha`): Search across official NCERT/CBSE curriculum modules with full attribution and direct links.
2. Open **Assessments** (`/assessments`): Take the interactive practice quiz on *Data Structures* or *Calculus*.
3. Submit to receive immediate score breakdown, question explanations, and targeted adaptive recommendations.

### Step 4: Student Creation Workspace (1 min)
1. Open **Creation Workspace** (`/workspace`): Document your study takeaways in the split-screen live Markdown editor. Click **"Print / PDF"** to export formatted notes.
2. Switch to **Coding Playground**: Run the binary search algorithm or derivative solver in the isolated, safe sandbox.

### Step 5: Educator Portal (1 min)
1. Navigate to `/teacher`: View class roster, student completion rates, average weekly study hours, assessment grading, and class weak area clustering.

---

## 8. Deployment Information

- **Build Output**: Clean Next.js 14 Standalone Production Build (`npm run build`)
- **Runtime Environment**: Node.js 22.x HTTP Server bound to `0.0.0.0:3000` (live preview enabled)
- **Vercel / Cloud Deployment**: Repository is Vercel and Supabase ready. In environments where external cloud provider credentials (`VERCEL_TOKEN`, `SUPABASE_SERVICE_KEY`) are not provided, the application runs locally and in live sandbox preview.

---

*Team Vision Forge · SIH 2026 · Problem Statement 26207 (Smart Education)*
