import { useEffect, useState } from "preact/hooks";
import { dict } from "../i18n";
import { useCtl } from "./ctx";
import { IconChevronRight, IconRefresh, IconWifiOff } from "./icons";

/** Countdown before the next attempt. */
function useCountdown(ms: number | undefined, key: unknown): number {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!ms) { setLeft(0); return; }
    const end = Date.now() + ms;
    const tick = () => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [ms, key]);
  return left;
}

/** BeyondATC cannot be reached: what is happening, what to check, retry. */
export function DisconnectedScreen() {
  const ctl = useCtl();
  const t = dict.value;
  const c = ctl.conn.value;
  const left = useCountdown(c.status === "waiting" ? c.nextRetryMs : undefined, c.attempt);
  const connecting = c.status === "connecting";
  const detail = [
    connecting ? t.attempt(Math.max(1, c.attempt)) : left > 0 ? t.retryIn(left) : "",
    !connecting && c.attempt >= 1 ? t.attempt(c.attempt) : "",
    ctl.url.replace(/^ws:\/\//, "")
  ].filter(Boolean).join(" · ");

  return (
    <div class="screen">
      <div class="screen-head">
        <span class={`screen-icon ${connecting ? "is-busy" : ""}`}><IconWifiOff size={28} /></span>
        <div class="screen-titles">
          <h1>{connecting ? t.connecting : t.notConnectedTitle}</h1>
          <span class="screen-sub">{detail}</span>
        </div>
      </div>
      {!connecting && c.attempt >= 2 && (
        <ul class="checklist">
          {t.checklist.map(item => <li key={item}>{item}</li>)}
        </ul>
      )}
      <div class="screen-actions">
        <button class="btn btn-primary" onClick={() => ctl.reconnect()}><IconRefresh size={16} /> {t.retryNow}</button>
      </div>
    </div>
  );
}

/** BeyondATC's "Start a flight" menu. */
export function MenuScreen() {
  const ctl = useCtl();
  const t = dict.value;
  const ls = ctl.store.loadState.value;
  return (
    <div class="screen screen-list">
      <h1>{t.menuTitle}</h1>
      {!ls.loggedIn ? (
        <p class="screen-text">{t.menuLogin}</p>
      ) : (
        <div class="menu-list">
          <MenuItem kind="IFR" label={t.planSimbrief} primary onClick={() => ctl.startFlight("IFR")} />
          {ls.vfr && <MenuItem kind="VFR" label={t.planSimbrief} onClick={() => ctl.startFlight("VFR_SIMBRIEF")} />}
          {ls.vfr && <MenuItem kind="VFR" label={t.planWorldMap} onClick={() => ctl.startFlight("VFR_MSFS")} />}
        </div>
      )}
    </div>
  );
}

function MenuItem({ kind, label, primary, onClick }: { kind: string; label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button class={`menu-item ${primary ? "is-primary" : ""}`} onClick={onClick}>
      <strong class={`menu-kind kind-${kind.toLowerCase()}`}>{kind}</strong>
      <span class="menu-label">{label}</span>
      <IconChevronRight size={16} class="menu-caret" />
    </button>
  );
}

/** Flight being prepared by BeyondATC (download, generation…). */
export function LoadingScreen() {
  const t = dict.value;
  const ls = useCtl().store.loadState.value;
  const known = ls.pct >= 0;
  const pct = Math.min(100, Math.max(0, ls.pct));
  return (
    <div class="screen">
      <div class="screen-head">
        {!known && <span class="spinner" />}
        <h1>{ls.text || t.loading}</h1>
      </div>
      {known && (
        <div class="load-row">
          <div class="load-bar"><div class="load-fill" style={{ width: `${pct}%` }} /></div>
          <span class="load-pct mono">{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}
