export type Theme = "light" | "dark" | "system";
export type Accent = "forest" | "indigo" | "clay";
export const THEME_KEY = "edunexus-theme";
export const ACCENT_KEY = "edunexus-accent";
export const MOTION_KEY = "edunexus-reduce-motion";

// Applied before first paint. Invalid / unavailable storage falls back safely.
export const themeScript = `(function(){try{var r=document.documentElement,t=localStorage.getItem('${THEME_KEY}'),a=localStorage.getItem('${ACCENT_KEY}');t=['light','dark','system'].includes(t)?t:'system';r.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;r.dataset.accent=['forest','indigo','clay'].includes(a)?a:'forest';r.dataset.preference=t;if(localStorage.getItem('${MOTION_KEY}')==='true')r.dataset.reduceMotion='true'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`;
