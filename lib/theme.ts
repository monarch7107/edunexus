export type Theme = "light" | "dark" | "system";
export type Palette = "sapphire" | "royal" | "neon" | "aurora";
export const THEME_KEY = "edunexus-theme";
export const PALETTE_KEY = "edunexus-palette";
export const MOTION_KEY = "edunexus-reduce-motion";
export const DEFAULT_PALETTE: Palette = "sapphire";

export const PALETTES: {
  value: Palette;
  label: string;
  tagline: string;
  description: string;
  swatches: [string, string, string];
  recommended?: boolean;
}[] = [
  {
    value: "sapphire",
    label: "Sapphire Blue + Ice Silver",
    tagline: "Recommended · Default",
    description: "Clean academic technology. Calm sapphire actions on ice-silver surfaces.",
    swatches: ["#2563EB", "#EAF4FF", "#0F172A"],
    recommended: true,
  },
  {
    value: "royal",
    label: "Royal Gold + Black",
    tagline: "Premium",
    description: "Luxury academic technology. Gold accents on black, charcoal and graphite.",
    swatches: ["#D4AF37", "#111111", "#E5E7EB"],
  },
  {
    value: "neon",
    label: "Neon",
    tagline: "Experimental",
    description: "Controlled futurism. Strategic neon accents for AI states on deep navy.",
    swatches: ["#00F5FF", "#0066FF", "#050816"],
  },
  {
    value: "aurora",
    label: "Aurora Scholar",
    tagline: "EduNexus signature",
    description: "Midnight to sapphire to aurora to ice. The uniquely EduNexus identity.",
    swatches: ["#155EEF", "#14B8A6", "#07111F"],
  },
];

const PALETTE_VALUES: Palette[] = ["sapphire", "royal", "neon", "aurora"];
const THEME_VALUES: Theme[] = ["light", "dark", "system"];

/** Lenient parsers: unknown / missing stored values fall back safely. */
export function parsePalette(value: unknown): Palette {
  return typeof value === "string" &&
    (PALETTE_VALUES as string[]).includes(value)
    ? (value as Palette)
    : DEFAULT_PALETTE;
}

export function parseTheme(value: unknown): Theme {
  return typeof value === "string" && (THEME_VALUES as string[]).includes(value)
    ? (value as Theme)
    : "system";
}

// Applied before first paint. Invalid / unavailable storage falls back safely.
export const themeScript = `(function(){try{var r=document.documentElement,t=localStorage.getItem('${THEME_KEY}'),p=localStorage.getItem('${PALETTE_KEY}');t=['light','dark','system'].includes(t)?t:'system';r.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;r.dataset.palette=['sapphire','royal','neon','aurora'].includes(p)?p:'sapphire';r.dataset.preference=t;if(localStorage.getItem('${MOTION_KEY}')==='true')r.dataset.reduceMotion='true'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.palette='sapphire'}})()`;
