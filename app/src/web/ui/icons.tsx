import type { JSX } from "preact";

type P = { size?: number; class?: string };

const base = (size = 20, cls = "", children: JSX.Element | JSX.Element[]) => (
  <svg class={`icon ${cls}`} style={{ width: `calc(${size}px * var(--s))`, height: `calc(${size}px * var(--s))` }} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{children}</svg>
);

export const IconRefresh = ({ size, class: c }: P) => base(size, c, [
  <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />, <path d="M4 3v5h5" />, <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />, <path d="M20 21v-5h-5" />
]);
export const IconArrowDown = ({ size, class: c }: P) => base(size, c, [<path d="M12 5v14" />, <path d="m6 13 6 6 6-6" />]);
export const IconMic = ({ size, class: c }: P) => base(size, c, [
  <rect x="9" y="3" width="6" height="11" rx="3" />, <path d="M6 11a6 6 0 0 0 12 0" />, <path d="M12 17v4" />
]);
export const IconWifiOff = ({ size, class: c }: P) => base(size, c, [
  <path d="M2 2l20 20" />, <path d="M8.5 16.4a5 5 0 0 1 7 0" />, <path d="M5 12.9a10 10 0 0 1 5.2-2.8" />,
  <path d="M19 12.9a10 10 0 0 0-2.3-1.7" />, <path d="M2 8.8a15 15 0 0 1 4.2-2.6" />, <path d="M22 8.8A15 15 0 0 0 10.7 5" />,
  <path d="M12 20h.01" />
]);
export const IconPlay = ({ size, class: c }: P) => base(size, c, [<path d="M7 5v14l11-7z" />]);
/* Chevrons are drawn, not typed: the Roboto files shipped with the app have no "▾" glyph. */
export const IconChevronDown = ({ size, class: c }: P) => base(size, c, [<path d="m6 9 6 6 6-6" />]);
export const IconChevronRight = ({ size, class: c }: P) => base(size, c, [<path d="m9 6 6 6-6 6" />]);
