# EduNexus Design Tokens

One product, four visual identities. This document is the maintainable source
for the EduNexus theme system: token architecture, per-theme palettes,
typography / spacing / radius / shadow / gradient systems, and the documented
places where accessibility required a deviation from the original brief hex.

## 1. Architecture

```
scripts/generate-themes.py   # SPEC table: single source of truth (hex)
        │  python3 scripts/generate-themes.py        → writes app/themes.css
        │  python3 scripts/generate-themes.py --check → contrast gate only
        ▼
app/themes.css               # GENERATED — 8 token blocks, never hand-edited
        │  imported first by app/globals.css
        ▼
tailwind.config.ts           # maps vars → utilities (rgb(var(--x) / <alpha>))
        ▼
components / app             # consume utilities only — zero hardcoded colors
```

Two independent axes, no parallel systems:

| Axis | Values | Stored in | Applied as |
|---|---|---|---|
| Palette (visual identity) | `sapphire` (default), `royal`, `neon`, `aurora` | `edunexus-palette` | `data-palette` |
| Mode (light / dark) | `light`, `dark`, `system` (default) | `edunexus-theme` | `data-theme` + `data-preference` |

Behavior preserved from the previous system: pre-paint script (no flash of
wrong theme), cross-tab storage sync, `prefers-reduced-motion` + manual motion
toggle, system-mode tracking. The retired `forest/indigo/clay` accent system
(`data-accent`) was fully removed — no component references it.

## 2. Semantic tokens

Every palette × mode defines the same 62 tokens. Components must use these
(through Tailwind utilities) instead of raw colors.

| Token | Purpose | Example utilities |
|---|---|---|
| `--background` → `--canvas` | App background | `bg-canvas` |
| `--foreground` → `--ink` | Primary text | `text-ink` |
| `--surface` / `--surface-elevated`→`--slate-50` / `--surface-muted`→`--slate-100` | Cards, raised, sunken | `bg-surface`, `bg-slate-50/100` |
| `--brand-50…900` (primary scale) | CTAs, nav, links, progress, AI actions | `bg-brand-600`, `text-brand-700` |
| `--on-accent` | Text on primary fills | `text-on-accent` |
| `--slate-50…950` (secondary scale) | Borders, inputs, secondary text | `border-slate-300`, `text-slate-600` |
| `--accent` → `--gold` | Highlights, achievement, premium/AI hairlines | `bg-gold`, `text-gold` |
| `--on-gold` | Text on gold fills | `text-on-gold` |
| `--border`→`--line`, `--border-subtle`→`--slate-200`, `--border-strong`→`--slate-300` | Dividers, rings | `border-line` |
| `--muted` / `--muted-foreground`→`--muted` | Secondary text | `text-muted` |
| `--success/--warning/--danger/--info` (+`-soft`, `-line`) | Status text/badges | `text-emerald-700`, `bg-red-50`… |
| `--success-strong` / `--on-success` | Success button fill | `bg-success-strong` |
| `--ai` / `--ai-soft` / `--ai-line` / `--on-ai` | AI visual language | `bg-ai`, `text-ai`, `bg-ai-soft` |
| `--focus` | Keyboard focus ring | `:focus-visible` (global) |
| `--overlay` | Modal scrims (with alpha) | `bg-overlay/60` |
| `--chart-1…5` | Data visualization hues | `bg-chart-1`, `style` |
| `--hero-bg/--hero-ink/--hero-muted/--hero-line` | Dark hero panels (dashboard, AI box, auth, landing) | `bg-hero`, `text-hero-muted` |
| `--gradient-from/--gradient-to` | Purposeful gradients only | `.gradient-brand`, `.gradient-text` |
| `--shadow` | Shadow tint | `shadow-card/lifted/popover` |
| `--ivory` | Warm paper tint (royal light) | `bg-ivory` |

> Naming note: the Tailwind utilities predate this document (`brand-*`,
> `slate-*`, `ink`, `line`…). They are already semantic — every one resolves
> to a theme variable. The mapping column above shows the §8 canonical names.

## 3. Palettes

### Sapphire Blue + Ice Silver — DEFAULT / Recommended

Clean academic technology. Sapphire for actions, ice/silver for structure.

| Role | Light | Dark |
|---|---|---|
| Primary / Deep | `#2563EB` / `#1D4ED8` | `#8FB4F5` (on dark) |
| Royal Sapphire (AI) | `#0F52BA` | `#6EA8FE` |
| Canvas / Surface | `#F4F7FC` / `#FFFFFF` | `#0B1526` / `#101D33` |
| Ink / Muted | `#0F172A` / `#475569` | `#E8F1FB` / `#9DB1C9` |
| Line | `#DDE5F0` | `#1E2E47` |
| Hero | `#16295E` | `#0E1B31` |
| Gradient | `#2563EB → #0F52BA` | `#3B82F6 → #6EA8FE` |
| Charts | `#2563EB #0F52BA #0284C7 #16A34A #D97706` | `#6EA8FE #8FB4F5 #67D3E0 #6FD39A #E5B96F` |

### Royal Gold + Black — PREMIUM

Luxury academic technology. Gold is an accent — never a flood.

| Role | Light | Dark |
|---|---|---|
| Gold action | `#8A6D1C` (AA-safe deep gold) | `#D4AF37` |
| Bright gold (AI/dark) | `#C9A227` | `#F4C542` |
| Canvas / Surface | `#FAF6EE` / `#FFFFFF` | `#050505` / `#111111` |
| Ink / Muted | `#141414` / `#5C5C5C` | `#E5E7EB` / `#B8BCC4` |
| Line | `#E5DFD2` | `#262626` |
| Hero | `#141414` | `#080604` |
| Gradient | `#C9A227 → #8A6D1C` | `#F4C542 → #9A7417` |

### Neon — EXPERIMENTAL

Controlled futurism. Neon is strategic: AI states, active controls, analytics.

| Role | Light | Dark |
|---|---|---|
| Electric blue | `#0066FF` | `#3B82F6` |
| Cyan (AI) | `#0E7490` | `#22D3EE` |
| Canvas / Surface | `#EEF6FF` / `#FFFFFF` | `#050816` / `#0B1026` |
| Ink / Muted | `#0B1026` / `#3D4B69` | `#EAFBFF` / `#8B9BB4` |
| Hero | `#0A1F44` | `#070C22` |
| Gradient | `#0066FF → #8B5CF6` | `#00F5FF → #8B5CF6` |

### Aurora Scholar — EDUNEXUS SIGNATURE

Midnight → Sapphire → Aurora → Ice. Academic trust + modern intelligence.

| Role | Light | Dark |
|---|---|---|
| Sapphire | `#155EEF` | `#5B9BF5` |
| Aurora (AI teal) | `#0C6B5E` | `#2DD4BF` |
| Soft gold (highlights) | `#EABF55` | `#EABF55` |
| Canvas / Surface | `#EFF4F8` / `#FFFFFF` | `#07111F` / `#0D1B2A` |
| Ink / Muted | `#101828` / `#475467` | `#E8F4F8` / `#9FB0C3` |
| Hero | `#0B1E3A` | `#050D18` |
| Gradient | `#155EEF → #14B8A6` | `#3B78EE → #2DD4BF` |

Status colors (all palettes, light): danger `#C81E1E`, warning `#92400E`,
success `#166534` (strong `#15803D`), info `#0369A1`. Dark modes use light
tints of the same hues so `text-surface` (dark) stays readable on fills.

## 4. Brief deviations (accessibility-driven, all documented)

Verified by `scripts/generate-themes.py --check`: **224/224 gated pairs pass**
across all 8 theme-modes (≥ 4.5:1 text, ≥ 3:1 focus). The gate includes the
**rendered worst case**: links on a 70%-opacity brand tint over surface —
the composition that direct token pairs miss (see 7).

1. **Danger `#DC2626` → `#C81E1E`** (light text token). `#DC2626` reaches only
   4.2:1 on the badge tint; the darkened token passes everywhere including the
   Danger button (white text).
2. **Warning/Success/Info text tokens darkened** (`#92400E`, `#166534`,
   `#0369A1`). The brief hexes (`#D97706`, `#16A34A`, `#0284C7`) fail as text
   (2.9–3.7:1); they are retained for charts and graphics.
3. **Royal-light gold action is deep gold `#8A6D1C`**, not `#D4AF37`: bright
   gold fails as link text on white (2.1:1). `#D4AF37`/`#F4C542` remain the
   dark-mode action golds and the light-mode highlight golds.
4. **Neon-light AI/cyan is `#0E7490`** (pure `#00F5FF` is unreadable on white);
   `#00F5FF`/`#22D3EE` are the dark-mode neon accents.
5. **Aurora-light aurora is `#0C6B5E`** for text roles; vivid `#14B8A6` is used
   for graphics and dark mode.
6. **Inactive chart bars** (`brand-300`) and **empty bars** (`slate-200`) are
   below 3:1 vs surface in some themes — accepted because every value is
   redundantly available as AA text (axis labels + focusable tooltips). Flagged
   as advisory output by the generator, never silently.
7. **Dedicated `--link` / `--link-hover` text-role tokens** (added 2026-09-11,
   E2E axe regression). Links sit on 70%-opacity brand tints
   (`bg-brand-50/70` callouts), where the composited background is slightly
   darker than pure surface: neon-light `#0066FF` on that composite measured
   **4.45:1** (under AA) while `brand-600 on surface` (4.83:1) passed the old
   gate — a fidelity gap in direct-pair checking. Fix: the link text role gets
   its own tokens (light = brand-700, dark = brand-600, per palette) and the
   generator now gates `link`/`link-hover` on surface **and** on the 70% tint
   composite. The brand scale stays reserved for buttons/graphics.
8. **Neon-dark and aurora-dark `--slate-500` brightened** (same pass): the
   inactive sidebar nav text measured **4.24:1** (neon) / **4.23:1** (aurora)
   on dark surface — under AA, and `slate-500 on surface` was not a gated
   pair. `#64789F → #7A94C4` (6.1:1) and `#6B7F97 → #7A94B4` (5.6:1); the pair
   is now gated in both modes.

## 5. Typography / spacing / radius / shadow

- **Type:** DM Sans Variable (body) + Manrope Variable (display, `font-display`).
  Scale in use: display 30–52px hero/page titles, H1 30–36px, H2 18–24px,
  H3 15–18px, body 13–15px, small 11–12px, caption/eyebrow 9–10px tracked caps.
  One pairing, no random mixing.
- **Spacing:** Tailwind 4px base scale throughout; no ad-hoc pixel values in
  new code.
- **Radius:** restrained — `rounded-md/lg/xl/2xl` for controls/cards, `full`
  only for pills, dots and avatars. No radius churn: the existing scale
  already matches the brief's intent.
- **Shadows:** three semantic levels — `shadow-card` (resting),
  `shadow-lifted` (hover), `shadow-popover` (menus/dialogs). Borders and tonal
  contrast carry elevation before shadows do.

## 6. Component + AI visual language

- Buttons: Primary / Secondary / Ghost / Outline / Danger / **Success** /
  **AI** — each with default, hover, active, `:focus-visible`, disabled and
  loading states (`aria-busy` + spinner).
- AI states: Running/Executing use the `--ai` tint ramp; Awaiting approval
  amber; Verified emerald; Needs attention red; Rejected neutral. The agent
  timeline, copilot card and approval badges all consume `--ai-*` / `--gold`
  so AI identity shifts per theme without code changes.
- Change sets show Current vs Proposed state; editing visibly invalidates the
  previous approval (status returns to `waiting_approval` with an explanatory
  notice). Unchanged by the theme work — verified by existing tests.

## 7. Regime

- Add a token: extend `SPEC` in `scripts/generate-themes.py` (all 8 blocks),
  add required contrast pairs, run `--check`, regenerate, map utilities in
  `tailwind.config.ts` if a class is needed.
- Never hardcode hex in `.tsx` (enforced by review; the only hex in components
  is the palette preview metadata in `lib/theme.ts`, which *depicts* themes).
  User-chosen subject colors are data, not theme, and correctly stay inline.
- Visual proof per theme lives in `tests/theme.spec.ts` (switching,
  persistence, mobile, dark-mode combos, axe on flagship routes).
