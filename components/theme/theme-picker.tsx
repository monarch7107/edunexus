"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun, Palette } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useTheme,
  type Theme,
  type Accent,
} from "@/components/providers/theme";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;
export const ACCENTS = [
  { value: "forest", label: "Forest", color: "#386e51" },
  { value: "indigo", label: "Iris", color: "#8065b5" },
  { value: "clay", label: "Terracotta", color: "#b67858" },
] as const;

export function ThemeOptions({ detailed = false }: { detailed?: boolean }) {
  const { theme, accent, setTheme, setAccent } = useTheme();
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold">Appearance</legend>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, Icon }) => (
            <button
              key={value}
              aria-pressed={theme === value}
              onClick={() => setTheme(value as Theme)}
              className={cn(
                "relative rounded-lg border p-3 text-xs transition-all hover:border-brand-400",
                theme === value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line text-muted",
              )}
            >
              {detailed && (
                <span
                  aria-hidden
                  className={cn(
                    "mb-3 flex h-16 gap-1.5 overflow-hidden rounded-md border p-1.5",
                    value === "dark"
                      ? "border-[#34443a] bg-[#1b2520]"
                      : value === "light"
                        ? "border-[#d7dfd3] bg-[#fbfcf9]"
                        : "border-[#b3c0b0] bg-[linear-gradient(90deg,#fbfcf9_50%,#1b2520_50%)]",
                  )}
                >
                  <span
                    className={cn(
                      "w-1/4 rounded-sm",
                      value === "dark" ? "bg-[#354a3b]" : "bg-[#dbe7d5]",
                    )}
                  />
                  <span className="flex flex-1 flex-col gap-1.5 py-1">
                    <span className="h-2 w-3/4 rounded-sm bg-[#9aae91]/60" />
                    <span className="flex-1 rounded-sm bg-[#9aae91]/20" />
                  </span>
                </span>
              )}
              <span className="flex items-center justify-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              {theme === value && detailed && (
                <Check className="absolute right-2 top-2 h-3 w-3 text-brand-600" />
              )}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-semibold">Accent color</legend>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((option) => (
            <button
              key={option.value}
              onClick={() => setAccent(option.value as Accent)}
              aria-pressed={accent === option.value}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium transition-colors",
                accent === option.value
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-line text-muted hover:bg-slate-50",
              )}
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ backgroundColor: option.color }}
              >
                {accent === option.value && (
                  <Check className="h-2.5 w-2.5 text-white" />
                )}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div
      className="relative"
      ref={ref}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className="icon-button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Customize appearance"
        title="Customize appearance"
        aria-expanded={open}
        aria-controls={id}
      >
        <Palette className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="fixed right-4 top-[72px] z-50 w-[min(320px,calc(100vw-32px))] rounded-xl border border-line bg-surface p-5 shadow-popover sm:absolute sm:right-0 sm:top-12"
          >
            <ThemeOptions />
            <p className="mt-4 border-t border-line pt-3 text-[10px] text-muted">
              Your workspace, your atmosphere. Saved on this device.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
