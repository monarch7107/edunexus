"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuietMotion } from "./motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  busy?: boolean;
}

function Dialog({
  onClose,
  title,
  description,
  children,
  size = "md",
  busy,
}: Omit<ModalProps, "open">) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  const id = useId();
  const quiet = useQuietMotion();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      const preferred = panel.current?.querySelector<HTMLElement>(
        "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-autofocus]",
      );
      (preferred || panel.current)?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyRef.current) {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const all = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]',
          ) ?? [],
        ).filter((el) => el.getClientRects().length > 0);
        const first = all[0],
          last = all[all.length - 1];
        if (!first) {
          e.preventDefault();
          panel.current?.focus();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !panel.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    // Only the dialog remains available to keyboard and assistive navigation.
    const siblings = Array.from(document.body.children).filter(
      (el) => el instanceof HTMLElement && !el.contains(panel.current),
    ) as HTMLElement[];
    const previousInert = siblings.map((el) => el.inert);
    siblings.forEach((el) => {
      el.inert = true;
    });
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      siblings.forEach((el, i) => {
        el.inert = previousInert[i];
      });
      if (previous?.isConnected && !previous.closest("[inert]"))
        previous.focus();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-black/35 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: quiet ? 0 : 0.18 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        initial={{ y: quiet ? 0 : 12, scale: quiet ? 1 : 0.975 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: quiet ? 0 : 8, scale: quiet ? 1 : 0.975 }}
        className={cn(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-popover outline-none",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
          <div>
            <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight">
              {title}
            </h2>
            {description && (
              <p
                id={`${id}-desc`}
                className="mt-1.5 text-sm leading-relaxed text-muted"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="icon-button -mr-1 -mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}
export function Modal({ open, ...props }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && <Dialog key="dialog" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}
