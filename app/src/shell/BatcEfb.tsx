import {
  App, AppBootMode, AppInstallProps, AppSuspendMode, AppView, AppViewProps, Efb, RequiredProps, TVNode
} from "@microsoft/msfs-efb-api";
import { FSComponent, VNode } from "@microsoft/msfs-sdk";

import "./BatcEfb.css";
import { findDockTop } from "./layout";

/** Folder of the app inside the package (defined in build.mjs). */
declare const BASE_URL: string;

/** How long the web app has to say it started before the shell shows an error. */
const READY_TIMEOUT_MS = 10000;

/** Space left between the app and the EFB dock drawn over its bottom. */
const DOCK_GAP_PX = 4;

/** Panel size published by the EFB (as used by other EFB apps). */
interface SubNumber { get(): number; sub(handler: (v: number) => void, initialNotify?: boolean): void }
interface PanelSizeGlobal { width: SubNumber; height: SubNumber }

/**
 * The EFB app is a thin shell around the BATC web app (src/web), shown in an <iframe>
 * loaded from this package: same screens and features as BATC Remote.
 * The web app talks to BeyondATC by itself (WebSocket ws://127.0.0.1:41716).
 *
 * The shell:
 *  - fits the frame between the EFB status bar (.efb-header) and the dock, in 2D and in 3D;
 *  - shows a waiting screen until the web app says it started ("batc-client-ready"),
 *    and the JavaScript errors it reports ("batc-client-error"), to help diagnosis in the sim;
 *  - tells the web app when the tablet is shown again ("batc-resume") and where the frame was
 *    placed ("batc-layout", shown in Settings > About to diagnose the fit).
 */
class BatcEfbView extends AppView<RequiredProps<AppViewProps, "bus">> {
  private readonly waitRef = FSComponent.createRef<HTMLDivElement>();
  private readonly waitTextRef = FSComponent.createRef<HTMLDivElement>();
  private frame: HTMLIFrameElement | null = null;
  private ready = false;
  private listening = false;
  private panelBound = false;
  private readyTimer: number | null = null;
  private fitTimer: number | null = null;

  public render(): VNode {
    return (
      <div class="batc-efb" ref={this.rootRef}>
        <div class="batc-efb-wait" ref={this.waitRef}>
          <div class="batc-efb-spinner" />
          <div class="batc-efb-wait-title">BATC EFB</div>
          <div class="batc-efb-wait-text" ref={this.waitTextRef}>Starting…</div>
        </div>
      </div>
    );
  }

  /** First opening of the app. */
  public onOpen(): void {
    this.listen();
    this.ensureFrame();
    this.bindPanelSize();
    this.scheduleFits();
  }

  /** Back to the app (or the tablet shown again). */
  public onResume(): void {
    this.ensureFrame();
    this.bindPanelSize();
    this.scheduleFits();
    this.postToFrame({ type: "batc-resume" });
  }

  private ensureFrame(): void {
    const root = this.rootRef.getOrDefault();
    if (this.frame || !root) return;
    const frame = document.createElement("iframe");
    frame.className = "batc-efb-frame";
    frame.src = `${BASE_URL}/web/index.html`;
    root.appendChild(frame);
    this.frame = frame;
    this.readyTimer = window.setTimeout(() => {
      this.readyTimer = null;
      if (!this.ready) this.showWaitText("BATC EFB could not start (no answer from the app page).");
    }, READY_TIMEOUT_MS);
  }

  private listen(): void {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener("message", (ev: MessageEvent): void => {
      if (!this.frame) return;
      const data = ev.data as { type?: string; message?: string } | null;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "batc-client-ready") {
        this.ready = true;
        if (this.readyTimer !== null) { window.clearTimeout(this.readyTimer); this.readyTimer = null; }
        const wait = this.waitRef.getOrDefault();
        if (wait) wait.style.display = "none";
        // The page can now receive the layout report.
        this.lastLayout = "";
        this.fitContentArea();
      } else if (data.type === "batc-client-error" && !this.ready) {
        // Errors after the start are left to the page; before it, they are the only clue.
        this.showWaitText(`Error: ${data.message ?? "unknown"}`);
      }
    });
  }

  private showWaitText(text: string): void {
    const el = this.waitTextRef.getOrDefault();
    if (el) el.textContent = text;
  }

  private postToFrame(msg: Record<string, unknown>): void {
    try { this.frame?.contentWindow?.postMessage(msg, "*"); } catch { /* frame not ready */ }
  }

  /** Follows the EFB panel size (it changes between the 2D window and the 3D cockpit). */
  private bindPanelSize(): void {
    if (this.panelBound) return;
    const ps = (window as unknown as { PanelSize?: PanelSizeGlobal }).PanelSize;
    if (!ps || !ps.width || !ps.height) return;
    this.panelBound = true;
    const apply = (): void => this.scheduleFits();
    ps.width.sub(apply, true);
    ps.height.sub(apply, true);
  }

  /** Layout settles over a few frames after opening or resizing: fit now and a little later. */
  private scheduleFits(): void {
    this.fitContentArea();
    if (this.fitTimer !== null) window.clearTimeout(this.fitTimer);
    let n = 0;
    const again = (): void => {
      this.fitContentArea();
      if (++n < 6) this.fitTimer = window.setTimeout(again, 250);
      else this.fitTimer = null;
    };
    this.fitTimer = window.setTimeout(again, 100);
  }

  /**
   * Places the frame between the EFB status bar (notifications, date and time) and the dock,
   * which are drawn over the app. Each side is ignored when nothing overlaps the app there.
   * The result is sent to the web app ("batc-layout"), which shows it in Settings > About:
   * the simulator's EFB markup is not documented, so this is how a wrong fit can be reported.
   */
  private fitContentArea(): void {
    const root = this.rootRef.getOrDefault();
    if (!root) return;
    const g = root.getBoundingClientRect();
    if (g.height <= 0) return;
    let top = 0;
    let headerSource = "none";
    const header = document.querySelector(".efb-header") as HTMLElement | null;
    if (header) {
      const r = header.getBoundingClientRect();
      if (r.height > 0 && r.bottom > g.top && r.bottom < g.bottom) { top = r.bottom - g.top; headerSource = ".efb-header"; }
    }
    const dock = findDockTop(root, g);
    // A small gap keeps the last row of the app clear of the dock icons.
    const bottom = dock ? dock.top - g.top - DOCK_GAP_PX : g.height;
    const height = Math.max(0, bottom - top);
    for (const el of [this.frame, this.waitRef.getOrDefault()]) {
      if (!el) continue;
      el.style.top = `${Math.round(top)}px`;
      el.style.height = `${Math.round(height)}px`;
    }
    const layout = {
      type: "batc-layout", width: Math.round(g.width), height: Math.round(g.height),
      top: Math.round(top), bottom: Math.round(g.height - bottom), header: headerSource, dock: dock ? dock.source : "none"
    };
    const key = JSON.stringify(layout);
    if (key !== this.lastLayout) { this.lastLayout = key; this.postToFrame(layout); }
  }

  private lastLayout = "";
}

class BatcEfb extends App {
  public get name(): string {
    return "BATC EFB";
  }

  public get icon(): string {
    return `${BASE_URL}/Assets/app-icon.svg`;
  }

  public BootMode = AppBootMode.COLD;
  /** Keep the app (and its connection to BeyondATC) alive when switching to another EFB app. */
  public SuspendMode = AppSuspendMode.SLEEP;

  public async install(_props: AppInstallProps): Promise<void> {
    await Efb.loadCss(`${BASE_URL}/BatcEfb.css`);
  }

  public render(): TVNode<BatcEfbView> {
    return <BatcEfbView bus={this.bus} />;
  }
}

Efb.use(BatcEfb);
