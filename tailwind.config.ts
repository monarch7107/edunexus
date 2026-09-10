import type { Config } from "tailwindcss";

const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: rgb("canvas"),
        surface: rgb("surface"),
        ink: rgb("ink"),
        muted: rgb("muted"),
        line: rgb("line"),
        "on-accent": rgb("on-accent"),
        gold: rgb("gold"),
        ivory: rgb("ivory"),
        brand: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [
            n,
            rgb(`brand-${n}`),
          ]),
        ),
        slate: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
            n,
            rgb(`slate-${n}`),
          ]),
        ),
        red: {
          50: rgb("danger-soft"),
          100: rgb("danger-soft"),
          200: rgb("danger-line"),
          300: rgb("danger-line"),
          400: rgb("danger"),
          500: rgb("danger"),
          600: rgb("danger"),
          700: rgb("danger"),
          800: rgb("danger"),
          900: rgb("danger"),
        },
        amber: {
          50: rgb("warning-soft"),
          100: rgb("warning-soft"),
          200: rgb("warning-line"),
          500: rgb("warning"),
          600: rgb("warning"),
          700: rgb("warning"),
          800: rgb("warning"),
          900: rgb("warning"),
        },
        emerald: {
          50: rgb("success-soft"),
          100: rgb("success-soft"),
          200: rgb("success-line"),
          500: rgb("success"),
          600: rgb("success"),
          700: rgb("success"),
        },
        sky: {
          50: rgb("info-soft"),
          100: rgb("info-soft"),
          200: rgb("info-line"),
          500: rgb("info"),
          600: rgb("info"),
          700: rgb("info"),
        },
        ai: rgb("ai"),
        "ai-soft": rgb("ai-soft"),
        "ai-line": rgb("ai-line"),
        "on-ai": rgb("on-ai"),
        "on-gold": rgb("on-gold"),
        "success-strong": rgb("success-strong"),
        "on-success": rgb("on-success"),
        hero: rgb("hero-bg"),
        "hero-ink": rgb("hero-ink"),
        "hero-muted": rgb("hero-muted"),
        "hero-line": rgb("hero-line"),
        focus: rgb("focus"),
        overlay: rgb("overlay"),
        chart: Object.fromEntries(
          [1, 2, 3, 4, 5].map((n) => [n, rgb(`chart-${n}`)]),
        ),
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', "system-ui", "sans-serif"],
        display: ['"Manrope Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 4px rgb(var(--shadow) / 0.025)",
        lifted: "0 8px 24px -12px rgb(var(--shadow) / 0.18)",
        popover: "0 12px 40px -8px rgb(var(--shadow) / 0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
