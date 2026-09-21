"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from "@/lib/i18n/languages";

export function LanguagePicker({ className }: { className?: string }) {
  const [current, setCurrent] = useState<SupportedLanguage>("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrent(getStoredLanguage());
  }, []);

  const handleSelect = (lang: SupportedLanguage) => {
    setCurrent(lang);
    setStoredLanguage(lang);
    setOpen(false);
    // Dispatch a custom event so other components update their language immediately.
    window.dispatchEvent(new CustomEvent("aieses_lang_changed", { detail: lang }));
  };

  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === current) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`relative inline-block ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-slate-50"
        aria-label="Select language"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5 text-brand-600" />
        <span>{selected.nativeName}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-line bg-surface p-1 shadow-lg">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Select Language
            </div>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  current === lang.code
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{lang.nativeName}</span>
                <span className="text-[10px] text-muted">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
