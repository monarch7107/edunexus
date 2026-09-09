import { dayKey } from "./utils";

/**
 * Timezone-safe task deadline handling (Step 9 / RC5).
 *
 * Rules:
 *  - Only real calendar dates (`YYYY-MM-DD`) are accepted; invalid values
 *    produce inline validation errors and never corrupt stored data.
 *  - Past dates are allowed (students log overdue work all the time).
 *  - Editing a task without touching its date preserves the EXACT stored
 *    timestamp — the day is compared in the viewer's local calendar and the
 *    original value is reused verbatim when the day is unchanged.
 *  - Clearing the date stores `null`.
 */

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for real calendar dates (rejects 2026-02-30, 2026-13-01, …). */
export function isValidCalendarDate(value: string): boolean {
  const match = DATE_INPUT_PATTERN.exec(value.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  // Noon avoids every DST transition; round-trip must reproduce the input.
  const probe = new Date(year, month - 1, day, 12, 0, 0, 0);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

/** Local `YYYY-MM-DD` for the date picker, from any stored due value. */
export function dateInputFromStored(stored: string | null): string {
  return dayKey(stored) ?? "";
}

/** Convert a validated `YYYY-MM-DD` to an end-of-local-day ISO timestamp. */
export function dateInputToStored(dateInput: string): string | null {
  if (!isValidCalendarDate(dateInput)) return null;
  const stamp = new Date(`${dateInput.trim()}T23:59:00`);
  if (Number.isNaN(stamp.getTime())) return null;
  return stamp.toISOString();
}

export type DueDateResolution =
  | { ok: true; due_date: string | null; unchanged: boolean }
  | { ok: false; error: string };

/**
 * Resolve the date-picker value against the stored deadline.
 *
 * - `unchanged: true` → the caller should leave the stored value untouched
 *   (for edits, omit `due_date` from the update payload entirely).
 * - `ok: false` → show `error` inline and do not submit.
 */
export function resolveTaskDueDate(options: {
  /** Currently stored deadline (`null` when the task has none). */
  original: string | null;
  /** Raw date-picker value (`""` when cleared). */
  dateInput: string;
  /** True when editing an existing task (vs creating). */
  isEdit: boolean;
}): DueDateResolution {
  const { original, dateInput, isEdit } = options;
  const trimmed = dateInput.trim();

  if (!trimmed) {
    // Cleared (or never set). Clearing an already-empty deadline changes nothing.
    if (isEdit && original == null) {
      return { ok: true, due_date: null, unchanged: true };
    }
    return { ok: true, due_date: null, unchanged: !isEdit };
  }

  if (!isValidCalendarDate(trimmed)) {
    return {
      ok: false,
      error: "That date doesn’t look valid. Pick a real calendar date.",
    };
  }

  if (isEdit && dateInputFromStored(original) === trimmed) {
    // Same local calendar day: keep the exact stored timestamp so a
    // title-only edit can never shift the deadline across timezones.
    return { ok: true, due_date: original, unchanged: true };
  }

  const stored = dateInputToStored(trimmed);
  if (!stored) {
    return {
      ok: false,
      error: "That date couldn’t be saved. Pick a real calendar date.",
    };
  }
  return { ok: true, due_date: stored, unchanged: false };
}
