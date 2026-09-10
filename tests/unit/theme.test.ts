import { describe, expect, it } from "vitest";
import {
  DEFAULT_PALETTE,
  PALETTES,
  PALETTE_KEY,
  parsePalette,
  parseTheme,
  themeScript,
} from "@/lib/theme";

describe("palette parsing", () => {
  it("accepts the four supported palettes", () => {
    expect(parsePalette("sapphire")).toBe("sapphire");
    expect(parsePalette("royal")).toBe("royal");
    expect(parsePalette("neon")).toBe("neon");
    expect(parsePalette("aurora")).toBe("aurora");
  });
  it("falls back to sapphire for unknown values", () => {
    expect(parsePalette("forest")).toBe("sapphire");
    expect(parsePalette("")).toBe("sapphire");
    expect(parsePalette(null)).toBe("sapphire");
    expect(parsePalette(undefined)).toBe("sapphire");
    expect(parsePalette(42)).toBe("sapphire");
  });
  it("defaults to sapphire", () => {
    expect(DEFAULT_PALETTE).toBe("sapphire");
  });
});

describe("theme preference parsing", () => {
  it("accepts light/dark/system", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
  });
  it("falls back to system for unknown values", () => {
    expect(parseTheme("neon")).toBe("system");
    expect(parseTheme(null)).toBe("system");
  });
});

describe("palette metadata", () => {
  it("describes four palettes with previews", () => {
    expect(PALETTES.map((p) => p.value)).toEqual([
      "sapphire",
      "royal",
      "neon",
      "aurora",
    ]);
    for (const palette of PALETTES) {
      expect(palette.label.length).toBeGreaterThan(0);
      expect(palette.description.length).toBeGreaterThan(0);
      expect(palette.swatches).toHaveLength(3);
      for (const swatch of palette.swatches) {
        expect(swatch).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
  it("marks exactly one palette as recommended default", () => {
    const recommended = PALETTES.filter((p) => p.recommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0].value).toBe("sapphire");
  });
});

describe("pre-paint theme script", () => {
  it("reads the palette key and pins a valid data-palette", () => {
    expect(themeScript).toContain(PALETTE_KEY);
    expect(themeScript).toContain("dataset.palette");
    expect(themeScript).toContain("sapphire");
    expect(themeScript).toContain("localStorage.getItem");
  });
  it("never references the retired accent system", () => {
    expect(themeScript).not.toContain("data-accent");
    expect(themeScript).not.toContain("edunexus-accent");
    expect(themeScript).not.toContain("forest");
  });
});
