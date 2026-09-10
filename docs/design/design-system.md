# EduNexus — Design System

## Direction

Premium, modern, academic, trustworthy, intelligent, refined — slightly
royal. Deliberately **not**: cyberpunk, generic-AI-template, robot imagery,
excessive glassmorphism, neon everywhere, dashboard-template aesthetics.

The **dashboard is the flagship experience**; the planner is its premium
companion; AI surfaces are contextual and trustworthy, not chatbot chrome.

## Two independent axes

| Axis | Values | Applied as | Stored as |
| --- | --- | --- | --- |
| Palette (visual identity) | `sapphire` (default — Sapphire Blue + Ice Silver), `royal` (Royal Gold + Black), `neon` (Neon), `aurora` (Aurora Scholar) | `data-palette` on `<html>` | `edunexus-palette` (localStorage) |
| Mode (appearance) | `light`, `dark`, `system` | `data-theme` + `data-preference` | `edunexus-theme` |
| Motion | default / reduced | `data-motion` | `edunexus-reduce-motion` + `prefers-reduced-motion` |

Both axes are applied by a **pre-paint inline script** (`themeScript` in
`lib/theme.ts`, injected in the root layout) so there is no theme flash, and
preferences sync across tabs (`storage` event).

## Tokens

Single source of truth: the `SPEC` table in `scripts/generate-themes.py`
(8 blocks = 4 palettes × 2 modes, 62 tokens each), which **emits**
`app/themes.css` and gates WCAG 2.2 AA contrast for every text-bearing pair
(≥ 4.5:1 text, ≥ 3:1 large/graphic). `app/themes.css` is generated — never
hand-edited.

`tailwind.config.ts` maps `rgb(var(--token) / <alpha-value>)` to utilities;
components consume utilities only. **Zero hardcoded hex in components**
(enforced by review; the token table and any documented deviations from the
original brief hex live in `docs/design/design-tokens.md`).

Core semantic tokens (full list in `docs/design/design-tokens.md`):
`--canvas --surface --ink --muted --line --brand-50…900 --danger* --warning*
--success* --info* --ai --ai-soft --ai-line --on-ai --gold --ivory --on-gold
--hero* --focus --overlay --shadow --chart-1…5`.

## Typography & motion

- **DM Sans Variable** (UI) + **Manrope Variable** (display), self-hosted via
  `@fontsource-variable` imports in `app/layout.tsx`.
- Framer Motion for list/dialog/content/chart transitions and notification
  motion; CSS feedback for buttons; real loading states and skeletons.
  Reduced motion is respected from the OS setting **and** the in-app toggle.

## Accessibility expectations

Keyboard navigation, visible focus (global `:focus-visible` outline on the
`--focus` token), semantic HTML, AA contrast (gated at token generation),
focus trapping/restoration in dialogs, labeled fields with hint/error copy,
chart labels, touch-friendly controls. Automated checks run in the E2E suite
(`@axe-core/playwright` in `tests/e2e/workspace.spec.ts`, `v2-ui.spec.ts`,
`theme.spec.ts`).

## Responsive targets

320 / 375 / 768 / 1024 / 1440+ — desktop sidebar collapses to mobile
navigation; grids reflow; the theme picker and search remain usable at every
width.
