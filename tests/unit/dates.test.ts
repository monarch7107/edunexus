import { describe, expect, test } from "vitest";
import {
  dateInputFromStored,
  dateInputToStored,
  isValidCalendarDate,
  resolveTaskDueDate,
} from "@/lib/dates";

/**
 * RC5: timezone-safe deadline handling.
 * Run this file under multiple timezones (Asia/Kolkata, America/Los_Angeles)
 * — every assertion below must hold in each.
 */

describe("RC5: strict calendar validation", () => {
  test("accepts real dates including leap days", () => {
    expect(isValidCalendarDate("2026-09-09")).toBe(true);
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(isValidCalendarDate("2020-01-15")).toBe(true);
  });

  test("rejects impossible and malformed dates", () => {
    for (const bad of [
      "",
      "not-a-date",
      "2026-13-01",
      "2026-00-10",
      "2026-02-30",
      "2023-02-29",
      "2026-04-31",
      "2026-9-9",
      "09/09/2026",
      "2026-09-09T10:00",
    ]) {
      expect(isValidCalendarDate(bad), bad).toBe(false);
    }
  });
});

describe("RC5: create / edit / clear / past / invalid", () => {
  test("create with date stores end-of-local-day", () => {
    const resolved = resolveTaskDueDate({
      original: null,
      dateInput: "2026-11-04",
      isEdit: false,
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error("unexpected");
    expect(resolved.unchanged).toBe(false);
    expect(resolved.due_date).toBe(new Date("2026-11-04T23:59:00").toISOString());
  });

  test("past dates are allowed", () => {
    const resolved = resolveTaskDueDate({
      original: null,
      dateInput: "2020-01-15",
      isEdit: false,
    });
    expect(resolved.ok).toBe(true);
  });

  test("edit title only preserves the EXACT stored timestamp", () => {
    // A timestamp whose UTC day differs from its local day in half the
    // world's timezones — the old slice(0,10) logic shifted these.
    for (const original of [
      "2026-09-06T00:30:00.000Z",
      "2026-09-05T18:29:00.000Z",
      "2026-09-05",
      "2026-12-31T23:59:59.000Z",
    ]) {
      const day = dateInputFromStored(original);
      expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const resolved = resolveTaskDueDate({
        original,
        dateInput: day,
        isEdit: true,
      });
      expect(resolved, original).toEqual({
        ok: true,
        due_date: original,
        unchanged: true,
      });
    }
  });

  test("explicit date change produces a new timestamp", () => {
    const resolved = resolveTaskDueDate({
      original: "2026-09-05T18:29:00.000Z",
      dateInput: "2026-09-20",
      isEdit: true,
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error("unexpected");
    expect(resolved.unchanged).toBe(false);
    expect(resolved.due_date).toBe(new Date("2026-09-20T23:59:00").toISOString());
  });

  test("clearing the date stores null", () => {
    const resolved = resolveTaskDueDate({
      original: "2026-09-05T18:29:00.000Z",
      dateInput: "",
      isEdit: true,
    });
    expect(resolved).toEqual({ ok: true, due_date: null, unchanged: false });
  });

  test("invalid date input never corrupts data — it errors inline", () => {
    const resolved = resolveTaskDueDate({
      original: "2026-09-05T18:29:00.000Z",
      dateInput: "2026-02-30",
      isEdit: true,
    });
    expect(resolved.ok).toBe(false);
    if (resolved.ok) throw new Error("unexpected");
    expect(resolved.error).toMatch(/doesn’t look valid/);
  });

  test("native empty-vs-unset: clearing an already-empty deadline is a no-op", () => {
    expect(
      resolveTaskDueDate({ original: null, dateInput: "", isEdit: true }),
    ).toEqual({ ok: true, due_date: null, unchanged: true });
  });
});

describe("RC5: timezone round-trips", () => {
  test("stored → picker → stored is stable for every representative day", () => {
    for (const day of ["2026-01-01", "2026-03-29", "2026-09-09", "2026-12-31"]) {
      const stored = dateInputToStored(day);
      expect(stored).not.toBeNull();
      // The picker must show back the same local day (no off-by-one).
      expect(dateInputFromStored(stored)).toBe(day);
    }
  });

  test("no arbitrary shifts: same-day datetimes keep their day key", () => {
    const stored = dateInputToStored("2026-09-09");
    expect(stored).not.toBeNull();
    const again = resolveTaskDueDate({
      original: stored,
      dateInput: "2026-09-09",
      isEdit: true,
    });
    expect(again).toEqual({ ok: true, due_date: stored, unchanged: true });
  });
});
