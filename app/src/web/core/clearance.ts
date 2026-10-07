import type { InfoBox } from "../protocol/types";

/** One clearance element shown on the single clearance line of the header. */
export interface ClearanceItem {
  /** Short upper-case label: "TAXI RWY", "SQUAWK"… */
  label: string;
  value: string;
}

/**
 * Short labels for the info boxes seen in BeyondATC captures. Keys are lower case, without a
 * trailing number ("Taxi Via 1" → "taxi via"). Unknown titles are shown in upper case as they are.
 */
const SHORT_LABELS: Record<string, string> = {
  "taxi to runway": "TAXI RWY",
  "taxi via": "VIA",
  "hold position": "HOLD",
  "altitude clearance": "ALT",
  "climb": "CLIMB",
  "continue climb to": "CLIMB",
  "squawk": "SQUAWK",
  "radar vectors": "VECTORS",
  "sid": "SID",
  "cleared for takeoff": "T/O RWY",
  "departure frequency": "DEP",
  "tower frequency": "TWR",
  "center frequency": "CTR"
};

export function clearanceLabel(title: string): string {
  const t = title.trim();
  const key = t.toLowerCase().replace(/\s+\d+$/, "");
  return SHORT_LABELS[key] ?? t.toUpperCase();
}

/** "6000 feet" → "6000 ft": the line is narrow. */
export function clearanceValue(lines: string[]): string {
  return lines.join(" / ").replace(/\bfeet\b/gi, "ft");
}

export function clearanceItems(boxes: InfoBox[]): ClearanceItem[] {
  return boxes
    .filter(b => b.title || b.lines.length > 0)
    .map(b => ({ label: clearanceLabel(b.title), value: clearanceValue(b.lines) }));
}
