import { clearanceItems } from "../core/clearance";
import type { FlightProgress } from "../protocol/types";
import { dict } from "../i18n";
import { useCtl } from "./ctx";

/** Facility names BeyondATC sends when COM1 has no station. */
const NO_STATION = new Set(["Radio Off", "Nothing Tuned", "No Station Tuned", ""]);

/**
 * Compact header, one line per piece of information (design "A — compact header"):
 *   identity + co-pilot switches | COM1 | COM2 + flight progress | clearance.
 * Out of a flight (menu, loading, no connection) only the identity line is shown.
 */
export function Header({ inFlight }: { inFlight: boolean }) {
  const ctl = useCtl();
  const t = dict.value;
  const status = ctl.conn.value.status;
  const cs = ctl.store.callsign.value;

  return (
    <header class="hdr">
      <div class="hdr-id">
        <span class={`dot dot-${status}`} />
        {cs ? (
          <span class="hdr-callsign">
            <strong>{cs.full}</strong>
            {cs.shortForm && <span class="hdr-short">{cs.shortForm}</span>}
          </span>
        ) : (
          <strong class="hdr-callsign">{t.appName}</strong>
        )}
        {inFlight ? <Copilot /> : <span class="hdr-status">{t.status[status] ?? status}</span>}
      </div>
      {inFlight && <Com1 />}
      {inFlight && <Com2AndProgress />}
      {inFlight && <Clearance />}
    </header>
  );
}

function Copilot() {
  const ctl = useCtl();
  const t = dict.value;
  const ar = ctl.store.autoRespond.value;
  const at = ctl.store.autoTune.value;
  const off = ctl.conn.value.status !== "open";
  return (
    <div class="copilot" role="group" aria-label={t.copilot}>
      <Pill label={t.autoRespond} value={!!ar} disabled={off || ar === null} onChange={v => ctl.setAutoRespond(v)} />
      <Pill label={t.autoTune} value={!!at} disabled={off || at === null} onChange={v => ctl.setAutoTune(v)} />
    </div>
  );
}

/** Compact on/off switch: a light and a label. */
function Pill({ label, value, disabled, onChange }: { label: string; value: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} class={`pill ${value ? "is-on" : ""}`} disabled={disabled} onClick={() => onChange(!value)}>
      <span class="pill-led" />{label}
    </button>
  );
}

function Com1() {
  const s = useCtl().store;
  const t = dict.value;
  const fac = s.facility.value;
  const muted = s.radioMute.value.com1;
  const idle = !fac || NO_STATION.has(fac.name) || !fac.frequency;
  // "Radio Off" is worth showing as is; the other "no station" names become "No station".
  const idleText = !fac || !fac.name || fac.name === "Nothing Tuned" || fac.name === "No Station Tuned" ? t.noStation : fac.name;

  return (
    <div class={`hdr-com1 ${muted ? "is-muted" : ""}`}>
      <span class="com-label">{t.com1}</span>
      {idle ? (
        <span class="com1-idle">{idleText}</span>
      ) : (
        <>
          <span class="com1-name" key={fac!.name}>{muted ? t.muted : fac!.name}</span>
          <span class="com1-freq mono" key={fac!.frequency}>{fac!.frequency}</span>
        </>
      )}
    </div>
  );
}

function Com2AndProgress() {
  const s = useCtl().store;
  const t = dict.value;
  const com2 = s.com2.value;
  const muted = s.radioMute.value.com2;
  const progress = s.progress.value;
  if (!com2 && !progress) return null;

  return (
    <div class="hdr-com2">
      {com2 && (
        <div class={`com2 ${muted ? "is-muted" : ""}`}>
          <span class="com-label">{t.com2}</span>
          {muted ? (
            <span class="com2-text">{t.muted}</span>
          ) : (
            <>
              {com2.label !== com2.frequency && <span class="com2-text">{com2.label}</span>}
              {com2.frequency && <strong class="com2-freq">{com2.frequency}</strong>}
              {com2.monitor && <span class="tag" title={t.monitor}>{t.monitorShort}</span>}
            </>
          )}
        </div>
      )}
      {progress && <Progress p={progress} />}
    </div>
  );
}

function Progress({ p }: { p: FlightProgress }) {
  return (
    <div class="prog" role="img" aria-label={`${p.from} → ${p.to} ${Math.round(p.pct)}%`}>
      <span class="prog-apt">{p.from}</span>
      <span class="prog-track"><span class="prog-fill" style={{ width: `${p.pct}%` }} /></span>
      <span class="prog-apt">{p.to}</span>
    </div>
  );
}

/** The clearance on one line (two if it does not fit): short label + value. */
function Clearance() {
  const t = dict.value;
  const items = clearanceItems(useCtl().store.infoBoxes.value);
  if (items.length === 0) return null;
  return (
    <div class="hdr-clr" role="list" aria-label={t.clearance}>
      {items.map((it, i) => (
        <span class="clr" role="listitem" key={`${it.label}-${i}`}>
          <span class="clr-label">{it.label}</span>
          <strong class="clr-value">{it.value}</strong>
        </span>
      ))}
    </div>
  );
}
