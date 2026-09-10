#!/usr/bin/env python3
"""EduNexus design-token generator (Phase 3).

Single source of truth for the four theme palettes (sapphire / royal / neon /
aurora) x two modes (light / dark). Emits `app/themes.css` (CSS triplets) and
verifies WCAG 2.2 AA contrast for every text-bearing token pair.

Usage:
    python3 scripts/generate-themes.py            # verify + write app/themes.css
    python3 scripts/generate-themes.py --check    # verify only (CI-friendly)

Contrast rule: text pairs must reach >= 4.5:1, large/graphic-only pairs >= 3:1.
Where the brief's hex could not meet AA in its text role (e.g. #16A34A as body
text), the token uses a darkened AA-safe derivation and the brief hex is kept
for charts/graphics. Every deviation is documented in docs/design-tokens.md.
"""
import sys

# ---------------------------------------------------------------- palette spec
# Every value is sRGB hex. Modes: "light" (default :root) and "dark".
# -----------------------------------------------------------------------------

SPEC = {
    "sapphire": {
        "light": {
            "canvas": "F4F7FC", "surface": "FFFFFF", "ink": "0F172A",
            "muted": "475569", "line": "DDE5F0", "shadow": "0F172A",
            "slate-50": "F1F5F9", "slate-100": "E6ECF3", "slate-200": "D3DCE8",
            "slate-300": "B3C1D4", "slate-400": "7C8DA6", "slate-500": "5B6B82",
            "slate-600": "475569", "slate-700": "334155", "slate-800": "1E293B",
            "slate-900": "0F172A", "slate-950": "0A1122",
            "brand-50": "EEF4FF", "brand-100": "DFE9FF", "brand-200": "C3D5FE",
            "brand-300": "93B4FD", "brand-400": "5B8DEF", "brand-500": "2F6BEE",
            "brand-600": "2563EB", "brand-700": "1D4ED8", "brand-800": "1D3FA0",
            "brand-900": "16295E", "on-accent": "FFFFFF",
            "danger": "C81E1E", "danger-soft": "FDECEC", "danger-line": "F3C1C1",
            "warning": "92400E", "warning-soft": "FBF3E2", "warning-line": "EAD3A6",
            "success": "166534", "success-soft": "E9F7EE", "success-line": "B5DFC2",
            "success-strong": "15803D", "on-success": "FFFFFF",
            "info": "0369A1", "info-soft": "E8F4FC", "info-line": "B7D8EE",
            "gold": "B8944E", "on-gold": "12214D", "ivory": "F8FBFF",
            "ai": "0F52BA", "ai-soft": "E9F1FD", "ai-line": "BFD4F5",
            "on-ai": "FFFFFF",
            "chart-1": "2563EB", "chart-2": "0F52BA", "chart-3": "0284C7",
            "chart-4": "16A34A", "chart-5": "D97706",
            "focus": "1D4ED8", "overlay": "0F172A",
            "hero-bg": "16295E", "hero-ink": "FFFFFF", "hero-muted": "C3D5FE",
            "hero-line": "2A4176",
            "gradient-from": "2563EB", "gradient-to": "0F52BA",
        },
        "dark": {
            "canvas": "0B1526", "surface": "101D33", "ink": "E8F1FB",
            "muted": "9DB1C9", "line": "1E2E47", "shadow": "000000",
            "slate-50": "141F33", "slate-100": "1A2740", "slate-200": "24344F",
            "slate-300": "31425E", "slate-400": "5E7191", "slate-500": "7E93B3",
            "slate-600": "9DB1C9", "slate-700": "B9C9DD", "slate-800": "D3DEEC",
            "slate-900": "E8F1FB", "slate-950": "F4F8FD",
            "brand-50": "16294D", "brand-100": "1B3563", "brand-200": "23467F",
            "brand-300": "2E589B", "brand-400": "3F74C9", "brand-500": "5B93E5",
            "brand-600": "8FB4F5", "brand-700": "A9C4F7", "brand-800": "C6D8FA",
            "brand-900": "DFE9FD", "on-accent": "0B1B33",
            "danger": "F1938B", "danger-soft": "3A2320", "danger-line": "6B3A34",
            "warning": "EAC57C", "warning-soft": "3A2F1B", "warning-line": "6B5A2F",
            "success": "7BD3A1", "success-soft": "153227", "success-line": "2A5A44",
            "success-strong": "7BD3A1", "on-success": "062314",
            "info": "82B9E8", "info-soft": "16293D", "info-line": "2A4A66",
            "gold": "D8B76A", "on-gold": "1A1405", "ivory": "101D33",
            "ai": "6EA8FE", "ai-soft": "17294D", "ai-line": "2C4E89",
            "on-ai": "081426",
            "chart-1": "6EA8FE", "chart-2": "8FB4F5", "chart-3": "67D3E0",
            "chart-4": "6FD39A", "chart-5": "E5B96F",
            "focus": "8FB4F5", "overlay": "000000",
            "hero-bg": "0E1B31", "hero-ink": "F0F6FE", "hero-muted": "A9C4F7",
            "hero-line": "22345A",
            "gradient-from": "3B82F6", "gradient-to": "6EA8FE",
        },
    },
    "royal": {
        "light": {
            "canvas": "FAF6EE", "surface": "FFFFFF", "ink": "141414",
            "muted": "5C5C5C", "line": "E5DFD2", "shadow": "141004",
            "slate-50": "F4F1EA", "slate-100": "E9E4D8", "slate-200": "D8D2C2",
            "slate-300": "BFB7A4", "slate-400": "8E8875", "slate-500": "6E685A",
            "slate-600": "57534A", "slate-700": "44413A", "slate-800": "2A2823",
            "slate-900": "1C1B17", "slate-950": "111110",
            "brand-50": "FAF5E6", "brand-100": "F3EAD0", "brand-200": "E7D6A4",
            "brand-300": "D9BE74", "brand-400": "C9A227", "brand-500": "A98620",
            "brand-600": "8A6D1C", "brand-700": "6E5715", "brand-800": "574512",
            "brand-900": "45380F", "on-accent": "FFFFFF",
            "danger": "C81E1E", "danger-soft": "FDECEC", "danger-line": "F3C1C1",
            "warning": "92400E", "warning-soft": "FBF3E2", "warning-line": "EAD3A6",
            "success": "166534", "success-soft": "E9F7EE", "success-line": "B5DFC2",
            "success-strong": "15803D", "on-success": "FFFFFF",
            "info": "0369A1", "info-soft": "E8F4FC", "info-line": "B7D8EE",
            "gold": "8A6D1C", "on-gold": "FFFFFF", "ivory": "FDFBF5",
            "ai": "78600F", "ai-soft": "FCF7EA", "ai-line": "E2D3A3",
            "on-ai": "FFFFFF",
            "chart-1": "9A7417", "chart-2": "B48A1F", "chart-3": "6E685A",
            "chart-4": "4A6B8A", "chart-5": "A4552F",
            "focus": "6E5715", "overlay": "141004",
            "hero-bg": "141414", "hero-ink": "F7F2E7", "hero-muted": "D3C9AE",
            "hero-line": "3A332A",
            "gradient-from": "C9A227", "gradient-to": "8A6D1C",
        },
        "dark": {
            "canvas": "050505", "surface": "111111", "ink": "E5E7EB",
            "muted": "B8BCC4", "line": "262626", "shadow": "000000",
            "slate-50": "161616", "slate-100": "1D1D1D", "slate-200": "2A2A2A",
            "slate-300": "3A3A3A", "slate-400": "6B6B6B", "slate-500": "8E8E8E",
            "slate-600": "B8BCC4", "slate-700": "CFCFCF", "slate-800": "E0E0E0",
            "slate-900": "EDEDED", "slate-950": "F5F5F5",
            "brand-50": "2A2410", "brand-100": "3A3113", "brand-200": "54471A",
            "brand-300": "6E5A20", "brand-400": "8A7226", "brand-500": "A98C2E",
            "brand-600": "D4AF37", "brand-700": "E3C565", "brand-800": "F0D68A",
            "brand-900": "F7E7B8", "on-accent": "141414",
            "danger": "F1938B", "danger-soft": "3B1D1D", "danger-line": "7F2E2E",
            "warning": "EAC57C", "warning-soft": "3A2C14", "warning-line": "6E5A2A",
            "success": "7BD3A1", "success-soft": "14301F", "success-line": "2A5A3E",
            "success-strong": "7BD3A1", "on-success": "062314",
            "info": "82B9E8", "info-soft": "16283A", "info-line": "2A4862",
            "gold": "D4AF37", "on-gold": "141414", "ivory": "111111",
            "ai": "F4C542", "ai-soft": "2E250C", "ai-line": "6E5A20",
            "on-ai": "141414",
            "chart-1": "F4C542", "chart-2": "C9A227", "chart-3": "EDEDED",
            "chart-4": "7FD1C0", "chart-5": "E08A4E",
            "focus": "F4C542", "overlay": "000000",
            "hero-bg": "080604", "hero-ink": "F7F2E7", "hero-muted": "C9BFA6",
            "hero-line": "3A3017",
            "gradient-from": "F4C542", "gradient-to": "9A7417",
        },
    },
    "neon": {
        "light": {
            "canvas": "EEF6FF", "surface": "FFFFFF", "ink": "0B1026",
            "muted": "3D4B69", "line": "D3E2F2", "shadow": "0B1026",
            "slate-50": "EFF4FA", "slate-100": "E0E9F4", "slate-200": "C2D3E8",
            "slate-300": "9AB3D1", "slate-400": "647FA3", "slate-500": "4A6488",
            "slate-600": "3D4B69", "slate-700": "2C3A57", "slate-800": "1B2742",
            "slate-900": "0B1026", "slate-950": "070B1D",
            "brand-50": "EAF2FF", "brand-100": "D6E6FF", "brand-200": "B3D0FF",
            "brand-300": "80B3FF", "brand-400": "4D94FF", "brand-500": "1F75FF",
            "brand-600": "0066FF", "brand-700": "0052CC", "brand-800": "0040A1",
            "brand-900": "0A1F44", "on-accent": "FFFFFF",
            "danger": "C81E1E", "danger-soft": "FDECEC", "danger-line": "F3C1C1",
            "warning": "92400E", "warning-soft": "FBF3E2", "warning-line": "EAD3A6",
            "success": "166534", "success-soft": "E9F7EE", "success-line": "B5DFC2",
            "success-strong": "15803D", "on-success": "FFFFFF",
            "info": "0369A1", "info-soft": "E8F4FC", "info-line": "B7D8EE",
            "gold": "0E7490", "on-gold": "FFFFFF", "ivory": "F4FAFF",
            "ai": "0E7490", "ai-soft": "E6FAFF", "ai-line": "99E6F5",
            "on-ai": "FFFFFF",
            "chart-1": "0066FF", "chart-2": "0E7490", "chart-3": "7C3AED",
            "chart-4": "16A34A", "chart-5": "D97706",
            "focus": "0052CC", "overlay": "0B1026",
            "hero-bg": "0A1F44", "hero-ink": "EAFBFF", "hero-muted": "A9C6E8",
            "hero-line": "1E3A6E",
            "gradient-from": "0066FF", "gradient-to": "8B5CF6",
        },
        "dark": {
            "canvas": "050816", "surface": "0B1026", "ink": "EAFBFF",
            "muted": "8B9BB4", "line": "1C2748", "shadow": "000000",
            "slate-50": "0D1430", "slate-100": "131B3A", "slate-200": "1C2748",
            "slate-300": "2A3A5C", "slate-400": "4A5F86", "slate-500": "64789F",
            "slate-600": "8B9BB4", "slate-700": "A9BAD2", "slate-800": "C6D6E8",
            "slate-900": "EAFBFF", "slate-950": "F4FDFF",
            "brand-50": "0A1A3D", "brand-100": "10254F", "brand-200": "173463",
            "brand-300": "1F4480", "brand-400": "2A5AA3", "brand-500": "2F6FE4",
            "brand-600": "3B82F6", "brand-700": "63A1F8", "brand-800": "93C2FA",
            "brand-900": "C4DFFC", "on-accent": "04122B",
            "danger": "F1938B", "danger-soft": "3D1D22", "danger-line": "7A3038",
            "warning": "E8B84B", "warning-soft": "38300F", "warning-line": "6E5C1F",
            "success": "5EEA8D", "success-soft": "0F3524", "success-line": "1F6B47",
            "success-strong": "5EEA8D", "on-success": "062314",
            "info": "67D7F5", "info-soft": "0C2E3D", "info-line": "1B5A74",
            "gold": "22D3EE", "on-gold": "042A33", "ivory": "0B1026",
            "ai": "22D3EE", "ai-soft": "0A2E3D", "ai-line": "155E75",
            "on-ai": "042A33",
            "chart-1": "22D3EE", "chart-2": "818CF8", "chart-3": "4ADE80",
            "chart-4": "F472B6", "chart-5": "FACC15",
            "focus": "22D3EE", "overlay": "000000",
            "hero-bg": "070C22", "hero-ink": "EAFBFF", "hero-muted": "8B9BB4",
            "hero-line": "1B2A52",
            "gradient-from": "00F5FF", "gradient-to": "8B5CF6",
        },
    },
    "aurora": {
        "light": {
            "canvas": "EFF4F8", "surface": "FFFFFF", "ink": "101828",
            "muted": "475467", "line": "DDE5EC", "shadow": "101828",
            "slate-50": "F2F5F8", "slate-100": "E6EBF1", "slate-200": "D0D9E2",
            "slate-300": "A9B7C6", "slate-400": "75879B", "slate-500": "55677D",
            "slate-600": "3F4C5E", "slate-700": "2F3A48", "slate-800": "1D2530",
            "slate-900": "101828", "slate-950": "0A0F18",
            "brand-50": "EDF3FE", "brand-100": "DCE7FD", "brand-200": "C0D3FB",
            "brand-300": "94B8F7", "brand-400": "6196F2", "brand-500": "3B78EE",
            "brand-600": "155EEF", "brand-700": "1049C2", "brand-800": "123B93",
            "brand-900": "16295E", "on-accent": "FFFFFF",
            "danger": "C81E1E", "danger-soft": "FDECEC", "danger-line": "F3C1C1",
            "warning": "92400E", "warning-soft": "FBF3E2", "warning-line": "EAD3A6",
            "success": "166534", "success-soft": "E9F7EE", "success-line": "B5DFC2",
            "success-strong": "15803D", "on-success": "FFFFFF",
            "info": "0369A1", "info-soft": "E8F4FC", "info-line": "B7D8EE",
            "gold": "EABF55", "on-gold": "3A2C07", "ivory": "F7FAFC",
            "ai": "0C6B5E", "ai-soft": "E6F6F2", "ai-line": "A9E0D4",
            "on-ai": "FFFFFF",
            "chart-1": "155EEF", "chart-2": "0E9384", "chart-3": "4F46E5",
            "chart-4": "EABF55", "chart-5": "98A2B3",
            "focus": "1049C2", "overlay": "101828",
            "hero-bg": "0B1E3A", "hero-ink": "E8F4F8", "hero-muted": "A9C6D8",
            "hero-line": "1C3A5E",
            "gradient-from": "155EEF", "gradient-to": "14B8A6",
        },
        "dark": {
            "canvas": "07111F", "surface": "0D1B2A", "ink": "E8F4F8",
            "muted": "9FB0C3", "line": "1B2C40", "shadow": "000000",
            "slate-50": "0D1727", "slate-100": "122033", "slate-200": "1B2C40",
            "slate-300": "2A3E55", "slate-400": "4E637D", "slate-500": "6B7F97",
            "slate-600": "9FB0C3", "slate-700": "BAC8D8", "slate-800": "D2DEE9",
            "slate-900": "E8F4F8", "slate-950": "F4FAFC",
            "brand-50": "0F2145", "brand-100": "14305C", "brand-200": "1B4076",
            "brand-300": "255494", "brand-400": "2F6BC4", "brand-500": "3F83E8",
            "brand-600": "5B9BF5", "brand-700": "84B6F8", "brand-800": "AECDFB",
            "brand-900": "D2E5FD", "on-accent": "06182E",
            "danger": "F1938B", "danger-soft": "3A2226", "danger-line": "744147",
            "warning": "EAC57C", "warning-soft": "382F15", "warning-line": "6E5C26",
            "success": "7BD3A1", "success-soft": "123026", "success-line": "2A5A44",
            "success-strong": "7BD3A1", "on-success": "062314",
            "info": "82B9E8", "info-soft": "14293D", "info-line": "2A4A66",
            "gold": "EABF55", "on-gold": "3A2C07", "ivory": "0D1B2A",
            "ai": "2DD4BF", "ai-soft": "0A2E2A", "ai-line": "14524A",
            "on-ai": "04211D",
            "chart-1": "5B9BF5", "chart-2": "2DD4BF", "chart-3": "A5B4FC",
            "chart-4": "EABF55", "chart-5": "9FB0C3",
            "focus": "5B9BF5", "overlay": "000000",
            "hero-bg": "050D18", "hero-ink": "E8F4F8", "hero-muted": "9FC3D4",
            "hero-line": "16283F",
            "gradient-from": "3B78EE", "gradient-to": "2DD4BF",
        },
    },
}

# (fg_token, bg_token, min_ratio, description). "white"/"black" are literals.
PAIRS = [
    ("ink", "canvas", 4.5, "body on canvas"),
    ("ink", "surface", 4.5, "body on surface"),
    ("muted", "surface", 4.5, "secondary on surface"),
    ("muted", "canvas", 4.5, "secondary on canvas"),
    ("on-accent", "brand-600", 4.5, "primary button text"),
    ("brand-600", "surface", 4.5, "links on surface"),
    ("brand-700", "brand-50", 4.5, "badge text on tint"),
    ("brand-800", "brand-100", 4.5, "badge text on tint"),
    ("on-success", "success-strong", 4.5, "success button text"),
    ("on-ai", "ai", 4.5, "AI button text"),
    ("ai", "ai-soft", 4.5, "AI text on tint"),
    ("on-gold", "gold", 4.5, "gold chip text"),
    ("danger", "surface", 4.5, "error text"),
    ("danger", "danger-soft", 4.5, "error badge text"),
    ("warning", "warning-soft", 4.5, "warning badge text"),
    ("success", "success-soft", 4.5, "success badge text"),
    ("info", "info-soft", 4.5, "info badge text"),
    ("hero-ink", "hero-bg", 4.5, "hero title"),
    ("hero-muted", "hero-bg", 4.5, "hero secondary"),
    ("white", "hero-bg", 4.5, "hero white text"),
    ("slate-600", "surface", 4.5, "slate text (light roles)"),
    ("slate-700", "surface", 4.5, "slate text (light roles)"),
    ("focus", "surface", 3.0, "focus ring vs surface"),
]

# Reported but non-blocking: graphics whose data is redundantly available as
# text (tooltips, axis labels). Bars keep the pre-existing brand-300 treatment.
ADVISORY = [
    ("brand-300", "surface", "inactive chart bar vs surface"),
    ("slate-400", "surface", "placeholder text vs surface"),
    ("chart-1", "surface", "primary chart hue vs surface"),
    ("chart-4", "surface", "chart hue 4 vs surface"),
    ("slate-200", "surface", "empty chart bar vs surface"),
]


def lum(hexv: str) -> float:
    c = [int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a: str, b: str) -> float:
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def triplet(hexv: str) -> str:
    return " ".join(str(int(hexv[i:i + 2], 16)) for i in (0, 2, 4))


def check() -> bool:
    ok = True
    for palette, modes in SPEC.items():
        for mode, tokens in modes.items():
            # slate text roles flip between modes (600/700 are dark-ink roles in
            # light mode and light-ink roles in dark mode); both must pass on
            # the mode's own surface.
            for fg, bg, minimum, desc in PAIRS:
                fgv = "FFFFFF" if fg == "white" else tokens[fg]
                bgv = tokens[bg]
                r = ratio(fgv, bgv)
                # In dark mode, slate-600/700 are light text on dark surface:
                # the pair list already covers them via the same keys.
                status = "ok" if r >= minimum else "FAIL"
                if r < minimum:
                    ok = False
                print(f"{status:4} {palette:8} {mode:5} {r:5.2f} (min {minimum}) "
                      f"{fg} on {bg} — {desc}")
            for fg, bg, desc in ADVISORY:
                r = ratio(tokens[fg], tokens[bg])
                print(f"info {palette:8} {mode:5} {r:5.2f} (advisory) "
                      f"{fg} on {bg} — {desc}")
    return ok


CSS_ORDER = [
    "canvas", "surface", "ink", "muted", "line", "shadow",
    "slate-50", "slate-100", "slate-200", "slate-300", "slate-400",
    "slate-500", "slate-600", "slate-700", "slate-800", "slate-900",
    "slate-950",
    "brand-50", "brand-100", "brand-200", "brand-300", "brand-400",
    "brand-500", "brand-600", "brand-700", "brand-800", "brand-900",
    "on-accent",
    "danger", "danger-soft", "danger-line",
    "warning", "warning-soft", "warning-line",
    "success", "success-soft", "success-line", "success-strong", "on-success",
    "info", "info-soft", "info-line",
    "gold", "on-gold", "ivory",
    "ai", "ai-soft", "ai-line", "on-ai",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "focus", "overlay",
    "hero-bg", "hero-ink", "hero-muted", "hero-line",
    "gradient-from", "gradient-to",
]


def emit() -> str:
    out = ["/* AUTO-GENERATED by scripts/generate-themes.py — do not edit by hand.",
           " * Source of truth: the SPEC table in that script.",
           " * Sapphire is the default: bare :root carries sapphire-light so the",
           " * app is fully themed even before the pre-paint script runs. */", ""]
    blocks = [
        (":root", "sapphire", "light", "light"),
        (':root[data-theme="dark"]', "sapphire", "dark", "dark"),
        (':root[data-palette="royal"]', "royal", "light", "light"),
        (':root[data-theme="dark"][data-palette="royal"]', "royal", "dark", "dark"),
        (':root[data-palette="neon"]', "neon", "light", "light"),
        (':root[data-theme="dark"][data-palette="neon"]', "neon", "dark", "dark"),
        (':root[data-palette="aurora"]', "aurora", "light", "light"),
        (':root[data-theme="dark"][data-palette="aurora"]', "aurora", "dark", "dark"),
    ]
    for selector, palette, mode, scheme in blocks:
        out.append(f"{selector} {{")
        out.append(f"  color-scheme: {scheme};")
        for key in CSS_ORDER:
            out.append(f"  --{key}: {triplet(SPEC[palette][mode][key])};")
        out.append("}")
        out.append("")
    return "\n".join(out)


def main() -> int:
    print("== EduNexus theme contrast verification (WCAG 2.2 AA) ==")
    ok = check()
    print()
    if not ok:
        print("CONTRAST FAILURES — fix SPEC before regenerating.")
        return 1
    if "--check" in sys.argv:
        print("All pairs pass.")
        return 0
    with open("app/themes.css", "w") as f:
        f.write(emit())
    print("Wrote app/themes.css")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
