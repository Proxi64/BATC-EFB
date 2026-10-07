import { useEffect, useState } from "preact/hooks";
import { prefs } from "../core/prefs";
import { dict } from "../i18n";
import { ActionsPanel } from "./ActionsPanel";
import { CommsIndicator } from "./CommsIndicator";
import { useCtl } from "./ctx";
import { AppErrorDialog, PromptDialog } from "./Dialogs";
import { FrequenciesPanel } from "./FrequenciesPanel";
import { Header } from "./Header";
import { LogPanel } from "./LogPanel";
import { DisconnectedScreen, LoadingScreen, MenuScreen } from "./Screens";
import { SettingsPanel } from "./SettingsPanel";
import { Toast } from "./toast";

/** Short outage tolerated before switching to the "disconnected" screen. */
const GRACE_MS = 6000;

type Tab = "actions" | "log" | "freq" | "settings";

/** Refreshes the display every second while a connection outage is ongoing. */
function useTickWhile(active: boolean): void {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => set(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

export function App() {
  const ctl = useCtl();
  const t = dict.value;
  const [tab, setTab] = useState<Tab>("actions");
  const c = ctl.conn.value;
  const open = c.status === "open";
  useTickWhile(!open);

  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(prefs.value.textScale));
  }, [prefs.value.textScale]);

  const longOutage = !open && (!c.everConnected || (c.downSince !== null && Date.now() - c.downSince > GRACE_MS));
  // Dimmed and non-interactive only while showing flight data from a connection being re-established.
  const stale = !open && !longOutage;
  const stage = ctl.store.loadState.value.stage;
  const inFlight = !longOutage && (stage === "ready" || stage === "turnaround");

  let content;
  if (tab === "settings") content = <SettingsPanel />;
  else if (longOutage) content = <DisconnectedScreen />;
  else if (stage === "menu") content = <MenuScreen />;
  else if (inFlight) content = tab === "actions" ? <ActionsPanel /> : tab === "log" ? <LogPanel /> : <FrequenciesPanel />;
  else content = <LoadingScreen />;

  return (
    <div class="app">
      <Header inFlight={inFlight} />
      {stale && <div class="reconnect-banner" role="status">{t.reconnecting}</div>}
      <nav class="tabs">
        <CommsIndicator inFlight={inFlight} />
        <div class="tab-list" role="tablist">
          <TabButton on={tab === "actions"} onClick={() => setTab("actions")} label={t.tabActions} />
          <TabButton on={tab === "log"} onClick={() => setTab("log")} label={t.tabLog} />
          <TabButton on={tab === "freq"} onClick={() => setTab("freq")} label={t.tabFreq} />
          <TabButton on={tab === "settings"} onClick={() => setTab("settings")} label={t.settings} />
        </div>
      </nav>
      <main class={`app-body ${stale && tab !== "settings" ? "is-stale" : ""}`}>{content}</main>
      <PromptDialog />
      <AppErrorDialog />
      <Toast />
    </div>
  );
}

function TabButton({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button role="tab" aria-selected={on} class={`tab ${on ? "is-on" : ""}`} onClick={onClick}>{label}</button>
  );
}
