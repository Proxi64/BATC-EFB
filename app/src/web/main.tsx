import { render } from "preact";
import { BatcController, type EfbLayout } from "./core/controller";
import { App } from "./ui/App";
import { ControllerContext } from "./ui/ctx";
import { dict } from "./i18n";
import "./styles.css";

/**
 * EFB edition of the BATC-Remote web app. It runs in an <iframe> of the EFB app
 * (shell: src/shell/BatcEfb.tsx), loaded from the package (coui://).
 * Messages exchanged with the shell (window.postMessage):
 *   page → shell  "batc-client-ready"   the app has started
 *   page → shell  "batc-client-error"   a JavaScript error (shown by the shell, for diagnosis)
 *   shell → page  "batc-resume"         the tablet / the app is shown again
 *   shell → page  "batc-layout"         where the frame was placed (shown in Settings > About)
 */

function post(type: string, extra: Record<string, unknown> = {}): void {
  try { if (window.parent && window.parent !== window) window.parent.postMessage({ type, ...extra }, "*"); } catch { /* no parent */ }
}

window.addEventListener("error", e => post("batc-client-error", { message: String(e.message || e) }));
window.addEventListener("unhandledrejection", e => post("batc-client-error", { message: String((e as PromiseRejectionEvent).reason) }));

/** Width (px) for which the app is drawn at scale 1; the app is scaled to the real width of the frame. */
const DESIGN_WIDTH = 480;

/**
 * Scales the whole app to the frame: the EFB tablet is much narrower (in CSS px) in the 3D
 * cockpit than in its 2D window, but the app must keep the same proportions in both.
 * The scale is a CSS variable (--s) that multiplies every size in styles.css, so the text
 * is laid out and drawn at its real size (sharper than a CSS transform, which the simulator
 * also draws inaccurately).
 */
let lastScale = 0;
function fit(): void {
  const w = window.innerWidth;
  if (w <= 0) return;
  const s = Math.round((w / DESIGN_WIDTH) * 1000) / 1000;
  if (s === lastScale) return;
  lastScale = s;
  document.documentElement.style.setProperty("--s", String(s));
}

const root = document.getElementById("app")!;
fit();
window.addEventListener("resize", fit);
setInterval(fit, 1000);

const controller = new BatcController();

try {
  render(
    <ControllerContext.Provider value={controller}>
      <App />
    </ControllerContext.Provider>,
    root
  );
  controller.start();
  post("batc-client-ready");
} catch (e) {
  post("batc-client-error", { message: `${dict.value.startError}: ${String(e)}` });
}

window.addEventListener("message", e => {
  const data = e.data as ({ type?: string } & Partial<EfbLayout>) | null;
  if (!data) return;
  if (data.type === "batc-resume") controller.checkAlive();
  else if (data.type === "batc-layout") {
    controller.efbLayout.value = {
      width: Number(data.width) || 0, height: Number(data.height) || 0, top: Number(data.top) || 0,
      bottom: Number(data.bottom) || 0, header: String(data.header ?? ""), dock: String(data.dock ?? "")
    };
  }
});

// Debug access from the Coherent debugger console: window.batc.store.log.value …
(window as unknown as { batc: BatcController }).batc = controller;
