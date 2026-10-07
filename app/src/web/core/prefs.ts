import { effect, signal } from "@preact/signals";

/** Preferences of the EFB app (never sent to BeyondATC). */
export interface Prefs {
  showTraffic: boolean;
  showCpdlc: boolean;
  /** Text size: 1 = normal */
  textScale: number;
}

const KEY = "batcEfb.prefs.v1";

const DEFAULTS: Prefs = {
  showTraffic: true,
  showCpdlc: true,
  textScale: 1
};

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* storage not available in this view */ }
  return { ...DEFAULTS };
}

export const prefs = signal<Prefs>(load());

export function updatePrefs(patch: Partial<Prefs>): void {
  prefs.value = { ...prefs.value, ...patch };
}

effect(() => {
  const v = prefs.value;
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ }
});
