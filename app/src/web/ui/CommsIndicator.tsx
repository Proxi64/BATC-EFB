import { commsIndicator } from "../core/comms";
import { dict } from "../i18n";
import { useCtl } from "./ctx";
import { IconMic } from "./icons";

/**
 * Radio exchange light, at the left of the tab bar: off when the frequency is quiet, lit while
 * a request is sent or awaited (blue, amber) and while transmitting (green), dim pulse for traffic.
 * Out of a flight it stays off.
 */
export function CommsIndicator({ inFlight }: { inFlight: boolean }) {
  const s = useCtl().store;
  const t = dict.value;
  const { mode, text } = s.comms.value;
  const st = inFlight ? commsIndicator(mode, text, s.pendingAction.value) : commsIndicator("ready", "", null);
  const label = t.commsStates[st.key] ?? st.key;
  const description = st.detail ? `${label}: ${st.detail}` : label;

  return (
    <div class={`comms-ind is-${st.light}`} role="status" aria-label={description} title={description}>
      <span class="comms-light"><IconMic size={15} /></span>
    </div>
  );
}
