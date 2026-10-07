import { useState } from "preact/hooks";
import { prefs, updatePrefs } from "../core/prefs";
import { PROTOCOL_VERSION, type Option } from "../protocol/types";
import { dict } from "../i18n";
import { useCtl } from "./ctx";
import { ConfirmDialog, Modal } from "./Dialogs";
import { IconChevronDown, IconPlay, IconRefresh } from "./icons";

declare const __APP_VERSION__: string;

const TEXT_SIZES = [0.85, 1, 1.15, 1.3];

/**
 * Settings tab: one line per setting (label on the left, control on the right).
 * EFB edition: no address to set (BeyondATC is on this PC), no phone options.
 * Sliders and drop-down lists are drawn by the app: the simulator's HTML engine does not
 * reliably support <input type="range"> and <select>.
 */
export function SettingsPanel() {
  const ctl = useCtl();
  const t = dict.value;
  const p = prefs.value;
  const [confirmQuit, setConfirmQuit] = useState(false);
  const status = ctl.conn.value.status;
  const open = status === "open";
  const layout = ctl.efbLayout.value;
  const settings = ctl.store.settings.value;

  return (
    <div class="panel settings-panel">
      <Section title={t.secConnection}>
        <div class="set-row">
          <span class={`dot dot-${status}`} />
          <span class="set-label">{t.status[status] ?? status} <span class="set-sub mono">{ctl.url.replace(/^ws:\/\//, "")}</span></span>
          <button class="icon-btn icon-btn-sm" onClick={() => ctl.reconnect()} aria-label={t.retryNow} title={t.retryNow}><IconRefresh size={16} /></button>
        </div>
      </Section>

      <Section title={t.secDisplay}>
        <div class="set-row">
          <span class="set-label">{t.textSize}</span>
          <div class="segmented segmented-sm" role="radiogroup" aria-label={t.textSize}>
            {TEXT_SIZES.map(v => (
              <button key={v} role="radio" aria-checked={p.textScale === v} class={p.textScale === v ? "is-on" : ""}
                onClick={() => updatePrefs({ textScale: v })} style={{ fontSize: `${v}em` }}>A</button>
            ))}
          </div>
        </div>
        {open && settings && settings.simIs2024 !== false && settings.taxiArrowsShown !== undefined && (
          <Switch label={t.taxiArrows} value={!!settings.taxiArrowsShown} onChange={v => ctl.setSetting("taxiArrowsShown", v)} />
        )}
      </Section>

      <BatcSettingsSections />

      {open && (
        <Section title={t.secFlight}>
          <div class="set-row">
            <button class="btn btn-danger btn-block" onClick={() => setConfirmQuit(true)}>{t.quit}</button>
          </div>
        </Section>
      )}

      <Section title={t.secAbout}>
        <About label={t.appVersion} value={__APP_VERSION__} />
        <About label={t.protocol} value={`${PROTOCOL_VERSION}${ctl.store.toolbarVersion.value ? ` (BeyondATC ${ctl.store.toolbarVersion.value})` : ""}`} />
        <About label={t.unknownMsgs} value={ctl.store.unknownPrefixes.value.join(", ") || t.none} />
        {layout && <About label={t.efbLayout} value={t.efbLayoutValue(layout.top, layout.bottom, layout.dock)} />}
        {ctl.store.toolbarVersion.value && ctl.store.toolbarVersion.value !== PROTOCOL_VERSION && (
          <p class="set-note text-warning">{t.protocolMismatch(ctl.store.toolbarVersion.value)}</p>
        )}
        <p class="set-note">{t.disclaimer}</p>
      </Section>

      {confirmQuit && (
        <ConfirmDialog text={t.quitConfirm} onCancel={() => setConfirmQuit(false)}
          onConfirm={() => { setConfirmQuit(false); ctl.quitToMenu(); }} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: preact.ComponentChildren }) {
  return <section class="set-section"><h2>{title}</h2>{children}</section>;
}

function About({ label, value }: { label: string; value: string }) {
  return <div class="set-row about-row"><span class="set-label">{label}</span><span class="about-value mono">{value}</span></div>;
}

/** Settings stored in BeyondATC (received via "Settings:"). */
function BatcSettingsSections() {
  const ctl = useCtl();
  const t = dict.value;
  const s = ctl.store.settings.value;
  if (ctl.conn.value.status !== "open") return null;
  if (!s) return <p class="set-note">{t.settingsWaiting}</p>;

  const set = (k: string, v: unknown) => ctl.setSetting(k, v);
  const hasDynamic = s.dynamicVoiceOn !== undefined;
  const dynamic = !!s.dynamicVoiceOn;
  const liveOk = !!(s.navigraphLinked && s.navigraphUltimate);

  return (
    <>
      <Section title={t.secAudio}>
        {s.voiceVolume !== undefined && (
          <Stepper label={t.voiceVolume} min={0} max={100} step={5} value={Number(s.voiceVolume)} suffix="%" onCommit={v => set("voiceVolume", v)} />
        )}
        {s.uiSounds !== undefined && <Switch label={t.uiSounds} value={!!s.uiSounds} onChange={v => set("uiSounds", v)} />}
      </Section>

      <Section title={t.secVoices}>
        {hasDynamic && <Switch label={t.dynamicVoice} value={dynamic} onChange={v => set("dynamicVoiceOn", v)} />}
        {hasDynamic && (
          <Picker label={t.dynamicGender} disabled={!dynamic} value={String(s.dynamicVoiceGender ?? 0)}
            options={s.voiceGenderOptions ?? []} onChange={v => set("dynamicVoiceGender", v)} />
        )}
        {hasDynamic && (
          <Picker label={t.manualVoice} disabled={dynamic} value={String(Number(s.autoRespondVoice) || 0)}
            options={(s.autoRespondVoiceOptions ?? []).map((label, i) => ({ value: String(i), label }))}
            onChange={v => set("autoRespondVoice", Number(v))}
            sample={() => ctl.playSample("autoRespond")} />
        )}
        <Picker label={t.controllerVoice} value={String(s.controllerVoice ?? "")} options={s.voiceQualityOptions ?? []}
          onChange={v => set("controllerVoice", v)} sample={() => ctl.playSample("controller")} />
        <Picker label={t.trafficVoice} value={String(s.trafficVoice ?? "")} options={s.voiceQualityOptions ?? []}
          onChange={v => set("trafficVoice", v)} sample={() => ctl.playSample("traffic")} />
        {s.premiumUnitsMax !== undefined && <PremiumBar units={Number(s.premiumUnits) || 0} max={Number(s.premiumUnitsMax) || 1} label={t.premiumChars} />}
      </Section>

      <Section title={t.secTraffic}>
        {s.trafficOn !== undefined && <Switch label={t.trafficOn} value={!!s.trafficOn} onChange={v => set("trafficOn", v)} />}
        {([["parkedDensity", t.parked], ["departuresDensity", t.departures], ["arrivalsDensity", t.arrivals], ["enrouteDensity", t.enroute]] as const)
          .filter(([k]) => s[k] !== undefined)
          .map(([k, label]) => <Stepper key={k} label={label} min={0} max={10} step={1} value={Number(s[k])} onCommit={v => set(k, v)} />)}
        {s.navigraphLiveTraffic !== undefined && (
          <Switch label={t.liveTraffic} hint={liveOk ? undefined : t.liveTrafficLocked}
            value={!!s.navigraphLiveTraffic && liveOk} disabled={!liveOk} onChange={v => set("navigraphLiveTraffic", v)} />
        )}
      </Section>
    </>
  );
}

/**
 * Value with − / + buttons around a track that can be clicked (a slider without dragging,
 * easier with the mouse in the cockpit). The value is sent at once, like the official toolbar on release.
 */
function Stepper({ label, min, max, step, value, suffix = "", onCommit, disabled }: {
  label: string; min: number; max: number; step: number; value: number; suffix?: string;
  onCommit: (v: number) => void; disabled?: boolean;
}) {
  const v = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const commit = (n: number) => {
    const c = Math.min(max, Math.max(min, Math.round(n / step) * step));
    if (c !== v) onCommit(c);
  };
  const onTrack = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return;
    commit(min + ((e.clientX - r.left) / r.width) * (max - min));
  };
  const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  return (
    <div class={`set-row ${disabled ? "is-disabled" : ""}`}>
      <span class="set-label">{label}</span>
      <button class="step-btn" disabled={disabled || v <= min} onClick={() => commit(v - step)} aria-label={`${label} −`}>−</button>
      <div class="track" onClick={disabled ? undefined : onTrack}>
        <div class="track-fill" style={{ width: `${pct}%` }} />
      </div>
      <button class="step-btn" disabled={disabled || v >= max} onClick={() => commit(v + step)} aria-label={`${label} +`}>+</button>
      <span class="set-value mono">{v}{suffix}</span>
    </div>
  );
}

/** Drop-down list replacement: the current value on a button, the choices in a dialog. */
function Picker({ label, value, options, onChange, disabled, sample }: {
  label: string; value: string; options: Option[]; onChange: (v: string) => void; disabled?: boolean; sample?: () => void;
}) {
  const t = dict.value;
  const [open, setOpen] = useState(false);
  if (options.length === 0) return null;
  const current = options.find(o => String(o.value) === value);
  return (
    <div class={`set-row ${disabled ? "is-disabled" : ""}`}>
      <span class="set-label">{label}</span>
      <button class="picker" disabled={disabled} onClick={() => setOpen(true)}>
        <span class="picker-value">{current ? (current.label || String(current.value)) : (value || "—")}</span>
        <IconChevronDown size={14} class="picker-caret" />
      </button>
      {sample && (
        <button class="icon-btn icon-btn-sm" disabled={disabled} onClick={() => sample()} aria-label={`${t.sample} ${label}`} title={t.sample}>
          <IconPlay size={14} />
        </button>
      )}
      {open && (
        <Modal onBackdrop={() => setOpen(false)}>
          <h2>{label}</h2>
          <div class="choice-list">
            {options.map(o => (
              <button key={String(o.value)} class={`choice ${String(o.value) === value ? "is-on" : ""}`}
                onClick={() => { setOpen(false); if (String(o.value) !== value) onChange(String(o.value)); }}>
                {o.label || String(o.value)}
              </button>
            ))}
          </div>
          <div class="modal-actions">
            <button class="btn" onClick={() => setOpen(false)}>{t.cancel}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PremiumBar({ units, max, label }: { units: number; max: number; label: string }) {
  const ratio = Math.min(1, Math.max(0, units / Math.max(1, max)));
  // Red → amber → green, as in BATC-Remote.
  const hue = Math.round(120 * ratio);
  return (
    <div class="set-row">
      <span class="set-label">{label}</span>
      <div class="meter"><div class="meter-fill" style={{ width: `${ratio * 100}%`, background: `hsl(${hue}, 55%, 50%)` }} /></div>
      <span class="set-value set-value-wide mono">{String(units).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</span>
    </div>
  );
}

/** Settings switch: label on the left, switch on the right, the whole line is the button. */
export function Switch({ label, value, disabled, onChange, hint }: {
  label: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      class={`set-row switch-row ${value ? "is-on" : ""}`}
      disabled={disabled}
      onClick={() => { onChange(!value); }}
    >
      <span class="set-label">{label}{hint && <small>{hint}</small>}</span>
      <span class="switch" aria-hidden="true"><span class="knob" /></span>
    </button>
  );
}
