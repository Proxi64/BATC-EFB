import { actionRows } from "../core/actions";
import { dict } from "../i18n";
import { useCtl } from "./ctx";

/**
 * The requests offered by BeyondATC, as a plain list (one line per request, no boxes) so that
 * the whole list fits on the tablet. Short answers (Affirm, Negative, FL060…) share a line.
 * The co-pilot switches are in the header.
 */
export function ActionsPanel() {
  const ctl = useCtl();
  const s = ctl.store;
  const t = dict.value;
  const actions = s.actions.value;
  const visible = s.actionsVisible.value;
  const pending = s.pendingAction.value;
  const stage = s.loadState.value.stage;
  const disabled = !visible || !!pending || ctl.conn.value.status !== "open";

  const act = (label: string, short: boolean) => (
    <button
      key={label}
      class={`act ${short ? "act-short" : ""} ${pending === label ? "is-pending" : ""}`}
      disabled={disabled}
      onClick={() => { if (!disabled) ctl.sendAction(label); }}
    >
      <span class="act-label">{label}</span>
      {pending === label && !short && <span class="act-sent">{t.sentShort}</span>}
    </button>
  );

  return (
    <div class="panel actions-panel">
      {stage === "turnaround" && (
        <div class="turnaround">
          <div class="turnaround-text">
            <strong>{t.turnaroundTitle}</strong>
            <span>{t.turnaroundText}</span>
          </div>
          <button class="btn btn-primary" onClick={() => { ctl.turnaround(); }}>{t.turnaroundBtn}</button>
        </div>
      )}

      {actions.length === 0 ? (
        <p class="empty">{t.noActions}</p>
      ) : (
        <div class={`act-list ${disabled ? "is-disabled" : ""}`} aria-busy={!visible}>
          {actionRows(actions).map(row =>
            row.kind === "long"
              ? act(row.label, false)
              : <div class="act-shorts" key={`short-${row.labels.join("|")}`}>{row.labels.map(l => act(l, true))}</div>
          )}
        </div>
      )}
    </div>
  );
}
