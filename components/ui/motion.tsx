"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/providers/theme";
import { cn } from "@/lib/utils";

export function useQuietMotion() {
  const system = useReducedMotion();
  const { reduceMotion } = useTheme();
  return Boolean(system || reduceMotion);
}
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const quiet = useQuietMotion();
  return (
    <motion.div
      className={cn("min-w-0", className)}
      initial={{ opacity: quiet ? 1 : 0, y: quiet ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: quiet ? 0 : 0.45, delay: quiet ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
export function AnimatedList({
  children,
  className,
  itemClassName,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const quiet = useQuietMotion();
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {Children.toArray(children).map((child, i) => (
          <motion.div
            key={isValidElement(child) ? (child.key ?? i) : i}
            layout={!quiet}
            initial={{
              opacity: quiet ? 1 : 0,
              y: quiet ? 0 : 8,
              scale: quiet ? 1 : 0.99,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: quiet ? 1 : 0.97 }}
            transition={{ duration: quiet ? 0 : 0.2 }}
            className={cn("min-w-0", itemClassName)}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function PageTransition({
  children,
  pageKey,
}: {
  children: ReactNode;
  pageKey: string;
}) {
  const quiet = useQuietMotion();
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: quiet ? 1 : 0, y: quiet ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: quiet ? 0 : 0.22 }}
    >
      {children}
    </motion.div>
  );
}
