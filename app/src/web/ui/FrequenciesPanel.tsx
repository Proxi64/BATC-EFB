import { useEffect, useState } from "preact/hooks";
import type { AirportFrequencies, FrequencyGroup } from "../core/frequencies";
import type { FrequencyEntry } from "../protocol/types";
import { dict } from "../i18n";
import { useCtl } from "./ctx";
import { IconRefresh } from "./icons";
import { toast } from "./toast";

/**
 * Frequencies as a table: one line per frequency (type, frequency, name) with a COM1 and a COM2
 * button. The departure / arrival switch and the refresh button share the first line.
 */
export function FrequenciesPanel() {
  const ctl = useCtl();
  const s = ctl.store;
  const t = dict.value;
  const g = s.groupedFrequencies.value;
  const progress = s.progress.value;
  const datis = s.datis.value;
  const [sel, setSel] = useState<number | null>(null);

  // Refresh every time the tab is opened (like the official toolbar).
  useEffect(() => { ctl.refreshFrequencies(); }, []);

  const refresh = (
    <button class="icon-btn icon-btn-sm" onClick={() => { ctl.refreshFrequencies(); }} aria-label={t.refresh} title={t.refresh}>
      <IconRefresh size={16} />
    </button>
  );

  if (!g || (g.airports.length === 0 && g.center.length === 0 && g.vfr.length === 0)) {
    return (
      <div class="panel freq-panel">
        <div class="freq-head"><span class="freq-empty">{t.freqEmpty}</span>{refresh}</div>
      </div>
    );
  }

  // Default selection: departure in the first half of the flight, arrival afterwards.
  const auto = progress && progress.pct >= 50 ? g.airports.length - 1 : 0;
  const idx = Math.min(sel ?? auto, Math.max(0, g.airports.length - 1));
  const airport = g.airports[idx];

  const roleOf = (ap: AirportFrequencies, i: number) => {
    if (progress?.from === ap.icao) return t.depShort;
    if (progress?.to === ap.icao) return t.arrShort;
    return i === 0 ? t.depShort : t.arrShort;
  };

  return (
    <div class="panel freq-panel">
      <div class="freq-head">
        {g.airports.length > 1 ? (
          <div class="segmented" role="tablist">
            {g.airports.map((ap, i) => (
              <button key={ap.icao + i} role="tab" aria-selected={i === idx} class={i === idx ? "is-on" : ""} onClick={() => setSel(i)}>
                {/* One inline box, so that the ICAO code and the role share a baseline. */}
                <span><strong>{ap.icao || "—"}</strong><small>{roleOf(ap, i)}</small></span>
              </button>
            ))}
          </div>
        ) : <span class="spacer" />}
        {refresh}
      </div>

      {airport && (
        <>
          <div class="freq-section"><strong>{airport.icao}</strong> {airport.name}</div>
          {airport.groups.map(gr => (
            <Group key={gr.type} group={gr} letter={gr.type === "ATIS" ? datis.get(airport.icao)?.letter : undefined}
              atis={gr.type === "ATIS" ? datis.get(airport.icao)?.text : undefined} />
          ))}
        </>
      )}

      {g.vfr.length > 0 && (
        <>
          <div class="freq-section">{t.vfr}</div>
          <Group group={{ type: "VFR", title: "VFR", entries: g.vfr }} />
        </>
      )}
      {g.center.length > 0 && (
        <>
          <div class="freq-section">{t.enrouteSection}</div>
          <Group group={{ type: "Center", title: t.center, entries: g.center }} />
        </>
      )}
    </div>
  );
}

function Group({ group, letter, atis }: { group: FrequencyGroup; letter?: string; atis?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {group.entries.map((e, i) => (
        <FreqRow key={e.frequency + e.name} e={e} label={i === 0 ? group.title : ""} letter={i === 0 ? letter : undefined} />
      ))}
      {atis && (
        // The text sits in its own block: the 2-line cut is applied to it, not to the padded button.
        <button class={`atis-text ${open ? "is-open" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span class="atis-body">{atis}</span>
        </button>
      )}
    </>
  );
}

function FreqRow({ e, label, letter }: { e: FrequencyEntry; label: string; letter?: string }) {
  const ctl = useCtl();
  const t = dict.value;
  const off = ctl.conn.value.status !== "open";
  const com1 = ctl.store.facility.value?.frequency === e.frequency;
  const com2 = ctl.store.com2.value?.frequency === e.frequency;
  const showName = e.name && e.name !== e.airport;

  const tune = (com: 1 | 2) => {
    const ok = com === 1 ? ctl.tuneCom1(e.frequency) : ctl.tuneCom2(e.frequency);
    if (ok) toast(t.tuned(e.frequency, com === 1 ? t.com1 : t.com2));
  };

  return (
    <div class={`freq-row ${com1 ? "is-active" : ""}`}>
      <span class="freq-type">{label}{letter && <span class="freq-letter">{letter}</span>}</span>
      <strong class="freq-value mono">{e.frequency}</strong>
      <span class="freq-name">
        {showName && <span class="freq-name-text">{e.name}</span>}
        {e.cpdlcLogonCode && <span class="tag tag-cpdlc">CPDLC {e.cpdlcLogonCode}</span>}
        {e.runways.length > 0 && <span class="rwys">{t.rwyShort} {e.runways.join(" ")}</span>}
      </span>
      <button class={`freq-btn ${com1 ? "is-com1" : ""}`} disabled={off} onClick={() => tune(1)}
        aria-label={`${t.tuneCom1} ${e.frequency}`} title={`${t.tuneCom1} ${e.frequency}`}>1</button>
      <button class={`freq-btn ${com2 ? "is-com2" : ""}`} disabled={off} onClick={() => tune(2)}
        aria-label={`${t.tuneCom2} ${e.frequency}`} title={`${t.tuneCom2} ${e.frequency}`}>2</button>
    </div>
  );
}
