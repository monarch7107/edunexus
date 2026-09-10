"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";

import {
  THEME_KEY,
  PALETTE_KEY,
  MOTION_KEY,
  parsePalette,
  parseTheme,
  type Theme,
  type Palette,
} from "@/lib/theme";
export type { Theme, Palette } from "@/lib/theme";

interface ThemeValue {
  theme: Theme;
  palette: Palette;
  reduceMotion: boolean;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: Palette) => void;
  setReduceMotion: (value: boolean) => void;
}
const Context = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("system");
  const [palette, updatePalette] = useState<Palette>("sapphire");
  const [reduceMotion, updateMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const preference = parseTheme(root.dataset.preference);
    // The pre-paint script in the root layout normally sets these before
    // first paint; ensure they exist even if that script was blocked.
    if (!root.dataset.theme) {
      root.dataset.preference = preference;
      root.dataset.theme =
        preference === "system" ? (media.matches ? "dark" : "light") : preference;
    }
    if (!root.dataset.palette) root.dataset.palette = "sapphire";
    updateTheme(preference);
    updatePalette(parsePalette(root.dataset.palette));
    updateMotion(root.dataset.reduceMotion === "true");
    const systemChange = () => {
      if (!root.dataset.preference || root.dataset.preference === "system") {
        root.dataset.theme = media.matches ? "dark" : "light";
      }
    };
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_KEY) {
        const next = parseTheme(event.newValue);
        updateTheme(next);
        root.dataset.preference = next;
        root.dataset.theme =
          next === "system" ? (media.matches ? "dark" : "light") : next;
      }
      if (event.key === PALETTE_KEY) {
        const next = parsePalette(event.newValue);
        updatePalette(next);
        root.dataset.palette = next;
      }
      if (event.key === MOTION_KEY) {
        updateMotion(event.newValue === "true");
        root.dataset.reduceMotion = String(event.newValue === "true");
      }
    };
    media.addEventListener("change", systemChange);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", systemChange);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const save = (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Theme still works in memory. */
      }
    };
    const transition = () => {
      document.documentElement.classList.add("theme-transition");
      window.setTimeout(
        () => document.documentElement.classList.remove("theme-transition"),
        250,
      );
    };
    return {
      theme,
      palette,
      reduceMotion,
      setTheme(next) {
        transition();
        updateTheme(next);
        save(THEME_KEY, next);
        document.documentElement.dataset.preference = next;
        document.documentElement.dataset.theme =
          next === "system"
            ? matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : next;
      },
      setPalette(next) {
        transition();
        updatePalette(next);
        save(PALETTE_KEY, next);
        document.documentElement.dataset.palette = next;
      },
      setReduceMotion(next) {
        updateMotion(next);
        save(MOTION_KEY, String(next));
        document.documentElement.dataset.reduceMotion = String(next);
      },
    };
  }, [theme, palette, reduceMotion]);

  return (
    <Context.Provider value={value}>
      <MotionConfig
        reducedMotion={reduceMotion ? "always" : "user"}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionConfig>
    </Context.Provider>
  );
}
export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
