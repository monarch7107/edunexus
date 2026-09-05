"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";

import {
  THEME_KEY,
  ACCENT_KEY,
  MOTION_KEY,
  type Theme,
  type Accent,
} from "@/lib/theme";
export type { Theme, Accent } from "@/lib/theme";

interface ThemeValue {
  theme: Theme;
  accent: Accent;
  reduceMotion: boolean;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
  setReduceMotion: (value: boolean) => void;
}
const Context = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("system");
  const [accent, updateAccent] = useState<Accent>("forest");
  const [reduceMotion, updateMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    updateTheme((root.dataset.preference as Theme) || "system");
    updateAccent((root.dataset.accent as Accent) || "forest");
    updateMotion(root.dataset.reduceMotion === "true");
    const media = matchMedia("(prefers-color-scheme: dark)");
    const systemChange = () => {
      if (!root.dataset.preference || root.dataset.preference === "system") {
        root.dataset.theme = media.matches ? "dark" : "light";
      }
    };
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_KEY) {
        const next = (
          ["light", "dark", "system"].includes(event.newValue || "")
            ? event.newValue
            : "system"
        ) as Theme;
        updateTheme(next);
        root.dataset.preference = next;
        root.dataset.theme =
          next === "system" ? (media.matches ? "dark" : "light") : next;
      }
      if (event.key === ACCENT_KEY) {
        const next = (
          ["forest", "indigo", "clay"].includes(event.newValue || "")
            ? event.newValue
            : "forest"
        ) as Accent;
        updateAccent(next);
        root.dataset.accent = next;
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
      accent,
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
      setAccent(next) {
        transition();
        updateAccent(next);
        save(ACCENT_KEY, next);
        document.documentElement.dataset.accent = next;
      },
      setReduceMotion(next) {
        updateMotion(next);
        save(MOTION_KEY, String(next));
        document.documentElement.dataset.reduceMotion = String(next);
      },
    };
  }, [theme, accent, reduceMotion]);

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
