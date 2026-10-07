/**
 * Where the EFB draws over the app: helpers of the shell (BatcEfb.tsx), kept free of the
 * MSFS SDK so that they can be checked in a browser, outside the simulator.
 */

/** Lowest part of the app that an EFB dock may cover. */
const DOCK_ZONE = 0.3;

/**
 * Top edge (viewport px) of the EFB dock when it is drawn over the bottom of the app, or null.
 * 1. Elements named after the dock (tag or class containing "dock").
 * 2. Otherwise, hit testing: points in the lowest part of the app that are covered by an element
 *    outside the app give the dock's position, whatever its markup.
 */
export function findDockTop(root: HTMLElement, g: DOMRect): { top: number; source: string } | null {
  const zoneTop = g.bottom - g.height * DOCK_ZONE;
  const covers = (r: DOMRect): boolean => r.height > 0 && r.width > 0 && r.top > zoneTop && r.top < g.bottom && r.right > g.left && r.left < g.right;

  let best: { top: number; source: string } | null = null;
  const named = document.querySelectorAll("dock, [class*='dock'], [class*='Dock']");
  for (let i = 0; i < named.length; i++) {
    const el = named[i] as HTMLElement;
    if (root.contains(el) || el.contains(root)) continue;
    const r = el.getBoundingClientRect();
    if (covers(r) && (!best || r.top < best.top)) best = { top: r.top, source: describe(el) };
  }
  if (best) return best;

  if (typeof document.elementFromPoint !== "function") return null;
  for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7]) {
    const x = g.left + g.width * fx;
    for (let y = zoneTop; y < g.bottom - 1; y += 3) {
      let el: Element | null = null;
      try { el = document.elementFromPoint(x, y); } catch { return null; }
      if (!el || root.contains(el) || el.contains(root) || el === document.body || el === document.documentElement) continue;
      // Climb to the outermost container that still lies in the dock zone and can be clicked
      // (a transparent, click-through wrapper does not hide the app).
      let top = el.getBoundingClientRect().top;
      let source = describe(el as HTMLElement);
      for (let p = el.parentElement; p && !p.contains(root); p = p.parentElement) {
        const r = p.getBoundingClientRect();
        if (!covers(r) || window.getComputedStyle(p).pointerEvents === "none") break;
        top = Math.min(top, r.top);
        source = describe(p);
      }
      if (!best || top < best.top) best = { top, source: `probe ${source}` };
      break;
    }
  }
  return best;
}

export function describe(el: HTMLElement): string {
  const cls = typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).join(".")}` : "";
  return `${el.tagName.toLowerCase()}${cls}`;
}
