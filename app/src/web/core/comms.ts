/**
 * State of the radio exchange, reduced to what the indicator on the tab bar shows:
 * a light (its state) and a description (tooltip / screen readers).
 */
export type CommsLight = "idle" | "sent" | "waiting" | "transmitting" | "traffic";

export interface CommsIndicatorState {
  light: CommsLight;
  /** Comms mode or "sent", used to pick the description. */
  key: string;
  /** Extra detail: the action sent or in progress, or the traffic message. */
  detail: string;
}

/**
 * @param mode    BeyondATC's CommsState mode (ready, traffic, speaking, awaiting, queued, request…)
 * @param text    its text
 * @param pending action sent from this app, awaiting BeyondATC's reaction
 */
export function commsIndicator(mode: string, text: string, pending: string | null): CommsIndicatorState {
  if (mode === "ready") {
    return pending ? { light: "sent", key: "sent", detail: pending } : { light: "idle", key: "ready", detail: "" };
  }
  if (mode === "traffic") return { light: "traffic", key: "traffic", detail: text };
  if (mode === "speaking") return { light: "transmitting", key: "speaking", detail: "" };
  // For "request", the text is the action in progress ("queued" lags by one, its text is generic).
  const detail = mode === "request" && text ? text : "";
  return { light: "waiting", key: mode, detail };
}
