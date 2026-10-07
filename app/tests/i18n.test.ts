import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { dict } from "../src/web/i18n";

/**
 * Characters of a TrueType font (cmap subtable format 4, Unicode BMP).
 * Enough for Roboto; it keeps the test free of a font library.
 */
function fontCharacters(file: string): Set<number> {
  const b = readFileSync(fileURLToPath(new URL(file, import.meta.url)));
  const u16 = (o: number) => b.readUInt16BE(o);
  const numTables = u16(4);
  let cmap = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (b.toString("latin1", rec, rec + 4) === "cmap") cmap = b.readUInt32BE(rec + 8);
  }
  if (cmap < 0) throw new Error("no cmap table");
  const chars = new Set<number>();
  for (let i = 0; i < u16(cmap + 2); i++) {
    const rec = cmap + 4 + i * 8;
    const sub = cmap + b.readUInt32BE(rec + 4);
    if (u16(sub) !== 4) continue;
    const segX2 = u16(sub + 6);
    const ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, offsets = deltas + segX2;
    for (let s = 0; s < segX2; s += 2) {
      const start = u16(starts + s), end = u16(ends + s), delta = u16(deltas + s), ro = u16(offsets + s);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        const glyph = ro === 0 ? (c + delta) & 0xffff : u16(offsets + s + ro + (c - start) * 2);
        if (glyph !== 0) chars.add(c);
      }
    }
  }
  return chars;
}

/** Every text of the dictionary, functions called with sample arguments. */
function allTexts(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (typeof v === "function") return [String(v(1, "COM1", "x"))];
  if (Array.isArray(v)) return v.flatMap(allTexts);
  if (v && typeof v === "object") return Object.values(v).flatMap(allTexts);
  return [];
}

describe("texts", () => {
  it("only use characters that the shipped Roboto fonts can draw", () => {
    const fonts = ["../src/web/fonts/Roboto-Medium.ttf", "../src/web/fonts/Roboto-Bold.ttf"].map(fontCharacters);
    expect(fonts[0]!.has("A".charCodeAt(0))).toBe(true);
    expect(fonts[0]!.has(0x25be)).toBe(false); // "▾": the reason for this test
    const missing = new Set<string>();
    for (const text of allTexts(dict.value)) {
      for (const ch of text) {
        if (fonts.some(f => !f.has(ch.codePointAt(0)!))) missing.add(`${ch} (U+${ch.codePointAt(0)!.toString(16)}) in "${text}"`);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
