"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun, Palette as PaletteIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useTheme,
  type Theme,
  type Palette,
} from "@/components/providers/theme";
import { PALETTES } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

function PaletteSwatches({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <span aria-hidden className="flex -space-x-1.5">
      {colors.map((color) => (
        <span
          key={color}
          className="size-5 rounded-full border-2 border-surface"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

export function ThemeOptions({ detailed = false }: { detailed?: boolean }) {
  const { theme, palette, setTheme, setPalette } = useTheme();
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
              <span className="flex items-center justify-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              {theme === value && (
                <Check className="absolute right-2 top-2 h-3 w-3 text-brand-600" />
              )}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-semibold">Theme</legend>
        <div className={cn("grid gap-2", detailed ? "sm:grid-cols-2" : "grid-cols-1")}>
          {PALETTES.map((option) => {
            const selected = palette === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setPalette(option.value as Palette)}
                aria-pressed={selected}
                className={cn(
                  "relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-brand-400",
                  selected
                    ? "border-brand-500 bg-brand-50"
                    : "border-line bg-surface",
                )}
              >
                <PaletteSwatches colors={option.swatches} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        selected ? "text-brand-800" : "text-ink",
                      )}
                    >
                      {option.label}
                    </span>
                    {option.recommended && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-on-accent">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted">
                    {option.tagline}
                  </span>
                  {detailed && (
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted">
                      {option.description}
                    </span>
                  )}
                </span>
                {selected && (
                  <Check
                    aria-hidden
                    className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-brand-600"
                  />
                )}
              </button>
            );
          })}
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
        <PaletteIcon className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="fixed right-4 top-[72px] z-50 max-h-[calc(100dvh-96px)] w-[min(340px,calc(100vw-32px))] overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-popover sm:absolute sm:right-0 sm:top-12"
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
