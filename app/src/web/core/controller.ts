import { signal } from "@preact/signals";
import { Commands, type StartFlightMode, type VoiceSample } from "../protocol/commands";
import { parseMessage } from "../protocol/parser";
import { BATC_PORT } from "../protocol/types";
import { BatcConnection, type ConnectionStatus } from "./connection";
import { BatcStore } from "./store";

/** Where the EFB shell placed the app (message "batc-layout"), shown in Settings > About. */
export interface EfbLayout {
  width: number;
  height: number;
  /** px hidden at the top by the EFB status bar, at the bottom by the dock */
  top: number;
  bottom: number;
  header: string;
  dock: string;
}

export interface ConnectionInfo {
  status: ConnectionStatus;
  url: string | null;
  attempt: number;
  nextRetryMs?: number;
  /** Has the app already been connected in this session? */
  everConnected: boolean;
  /** Timestamp of the disconnection (null if connected). */
  downSince: number | null;
}

/**
 * BeyondATC runs on the same PC as the simulator: the EFB always talks to it locally.
 * For tests in a browser, "?host=ip:port" in the page address overrides it.
 */
export function batcUrl(search: string = typeof location !== "undefined" ? location.search : ""): string {
  const m = /[?&]host=([^&]+)/.exec(search);
  const host = m ? decodeURIComponent(m[1]!).trim() : "";
  if (!host) return `ws://127.0.0.1:${BATC_PORT}`;
  return `ws://${/:\d+$/.test(host) ? host : `${host}:${BATC_PORT}`}`;
}

/**
 * Wires connection + parser + store, and exposes the pilot's actions.
 * The UI only talks to this object.
 * EFB edition of the BATC-Remote controller: BeyondATC is always on this PC, so there is
 * no address to find or configure.
 */
export class BatcController {
  readonly store = new BatcStore();
  readonly url = batcUrl();
  readonly conn = signal<ConnectionInfo>({ status: "idle", url: this.url, attempt: 0, everConnected: false, downSince: Date.now() });
  readonly efbLayout = signal<EfbLayout | null>(null);

  private readonly connection: BatcConnection;
  private settingsTimer: ReturnType<typeof setInterval> | undefined;
  private listening = false;

  constructor() {
    this.connection = new BatcConnection({
      url: () => this.url,
      onFrame: frame => this.store.apply(parseMessage(frame)),
      onStatus: (status, d) => this.onStatus(status, d.attempt, d.nextRetryMs),
      onOpen: () => this.onOpen()
    });
  }

  start(): void {
    this.connection.start();
    if (this.listening) return;
    this.listening = true;
    // EFB shown again (the EFB shell sends "batc-resume"): check right away that the connection is alive.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.connection.checkAlive();
    });
  }

  /** The tablet was shown again: make sure the connection is still alive. */
  checkAlive(): void { this.connection.checkAlive(); }
  reconnect(): void { this.connection.reconnectNow(); }

  get isOpen(): boolean { return this.connection.isOpen; }

  // ---------- pilot actions ----------

  sendAction(label: string): boolean {
    if (!this.send(Commands.setAction(label))) return false;
    this.store.markActionSent(label);
    return true;
  }
  tuneCom1(freq: string): boolean { return this.send(Commands.setFrequencyCom1(freq)); }
  tuneCom2(freq: string): boolean { return this.send(Commands.setFrequencyCom2(freq)); }
  setAutoTune(on: boolean): void { if (this.send(Commands.setAutoTune(on))) this.store.autoTune.value = on; }
  setAutoRespond(on: boolean): void { if (this.send(Commands.setAutoRespond(on))) this.store.autoRespond.value = on; }
  setSetting(key: string, value: unknown): void {
    if (!this.send(Commands.setSetting(key, value))) return;
    const cur = this.store.settings.value;
    if (cur) this.store.settings.value = { ...cur, [key]: value };
  }
  playSample(which: VoiceSample): void { this.send(Commands.playSample(which)); }
  startFlight(mode: StartFlightMode): void { this.send(Commands.startFlight(mode)); }
  answerPrompt(yes: boolean): void {
    const p = this.store.prompt.value;
    if (!p) return;
    if (this.send(Commands.promptReply(p.id, yes))) this.store.prompt.value = null;
  }
  ackError(): void { this.send(Commands.ackError()); this.store.appError.value = null; }
  quitToMenu(): void { this.send(Commands.quitToMenu()); }
  turnaround(): void {
    if (!this.send(Commands.turnaround())) return;
    this.store.loadState.value = { ...this.store.loadState.value, stage: "download", text: "Starting Turnaround…", pct: -1 };
  }
  refreshFrequencies(): void { this.send(Commands.datis()); this.send(Commands.frequencies()); }
  refreshLog(): void { this.store.clearLog(); this.send(Commands.atcLog()); }

  // ---------- internal ----------

  private send(cmd: string): boolean {
    return this.connection.send(cmd);
  }

  private onOpen(): void {
    // BeyondATC sends a snapshot of the state by itself; the log history and
    // the frequencies (never sent spontaneously) still have to be requested.
    this.store.clearLog();
    this.send(Commands.atcLog());
    this.send(Commands.settings());
    this.refreshFrequencies();
    clearInterval(this.settingsTimer);
    this.settingsTimer = setInterval(() => {
      if (this.store.settings.value || !this.connection.isOpen) { clearInterval(this.settingsTimer); return; }
      this.send(Commands.settings());
    }, 3000);
  }

  private onStatus(status: ConnectionStatus, attempt: number, nextRetryMs?: number): void {
    const prev = this.conn.value;
    const open = status === "open";
    this.conn.value = {
      status,
      url: this.url,
      attempt,
      nextRetryMs,
      everConnected: prev.everConnected || open,
      downSince: open ? null : (prev.downSince ?? Date.now())
    };
    if (!open && prev.status === "open") {
      // Stale information must not be used to act: questions and errors are dropped.
      this.store.prompt.value = null;
      this.store.appError.value = null;
    }
  }
}
