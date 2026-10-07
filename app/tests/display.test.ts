import { describe, expect, it } from "vitest";
import { actionRows, isShortAction } from "../src/web/core/actions";
import { clearanceItems, clearanceLabel, clearanceValue } from "../src/web/core/clearance";
import { parseMessage } from "../src/web/protocol/parser";
import type { InfoBox } from "../src/web/protocol/types";
import { loadCapture } from "./helpers";

const incoming = () => loadCapture().filter(e => e.dir === "in" && e.conn === "A").map(e => parseMessage(e.text));

describe("clearance line", () => {
  it("shortens the titles seen in the real capture", () => {
    const titles = new Set<string>();
    for (const m of incoming()) if (m.kind === "infoBoxes") m.items.forEach(b => titles.add(b.title));
    expect(titles.size).toBeGreaterThan(5);
    for (const title of titles) {
      // Every title seen in a real flight gets a short label (the line is narrow).
      expect(clearanceLabel(title).length, title).toBeLessThanOrEqual(8);
    }
    expect(clearanceLabel("Taxi to Runway")).toBe("TAXI RWY");
    expect(clearanceLabel("climb")).toBe("CLIMB");
    expect(clearanceLabel("Cleared for Takeoff")).toBe("T/O RWY");
  });

  it("drops the number of numbered titles and keeps unknown titles readable", () => {
    expect(clearanceLabel("Taxi Via 1")).toBe("VIA");
    expect(clearanceLabel("Taxi Via 2")).toBe("VIA");
    expect(clearanceLabel("  Expect Approach ")).toBe("EXPECT APPROACH");
  });

  it("shortens the values", () => {
    expect(clearanceValue(["6000 feet"])).toBe("6000 ft");
    expect(clearanceValue(["A", "B"])).toBe("A / B");
  });

  it("builds one item per box, skipping empty boxes", () => {
    const boxes: InfoBox[] = [
      { title: "Taxi to Runway", lines: ["21"] },
      { title: "Altitude Clearance", lines: ["6000 feet"] },
      { title: "", lines: [] }
    ];
    expect(clearanceItems(boxes)).toEqual([
      { label: "TAXI RWY", value: "21" },
      { label: "ALT", value: "6000 ft" }
    ]);
  });
});

describe("action rows", () => {
  it("keeps the order and groups consecutive short actions", () => {
    expect(actionRows(["Request Departure", "Affirm", "Negative", "Say Again", "FL060", "FL080"])).toEqual([
      { kind: "long", label: "Request Departure" },
      { kind: "short", labels: ["Affirm", "Negative"] },
      { kind: "long", label: "Say Again" },
      { kind: "short", labels: ["FL060", "FL080"] }
    ]);
  });

  it("uses the same threshold as before (8 characters)", () => {
    expect(isShortAction("Negative")).toBe(true);
    expect(isShortAction("Say Again")).toBe(false);
  });

  it("never loses an action of the real capture", () => {
    for (const m of incoming()) {
      if (m.kind !== "actions") continue;
      const flat = actionRows(m.items).flatMap(r => (r.kind === "long" ? [r.label] : r.labels));
      expect(flat).toEqual(m.items);
    }
  });
});
