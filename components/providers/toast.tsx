"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme";

type ToastKind = "success" | "error";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}
interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const systemMotion = useReducedMotion();
  const { reduceMotion } = useTheme();
  const quiet = systemMotion || reduceMotion;
  const remove = useCallback(
    (id: string) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );
  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, kind, message }]);
      const timer = setTimeout(
        () => {
          remove(id);
          timers.current.delete(timer);
        },
        kind === "error" ? 6500 : 4200,
      );
      timers.current.add(timer);
    },
    [remove],
  );
  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);
  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-[360px] lg:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{
                opacity: 0,
                y: quiet ? 0 : 18,
                scale: quiet ? 1 : 0.98,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: quiet ? 0 : 24 }}
              transition={{ duration: quiet ? 0 : 0.2 }}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-popover"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  t.kind === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                {t.kind === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </span>
              <p className="flex-1 text-xs font-medium leading-relaxed">
                {t.message}
              </p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="icon-button -mr-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
