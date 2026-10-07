/** Actions this long or shorter (Affirm, Negative, FL060…) are drawn as small buttons side by side. */
export const SHORT_ACTION_MAX = 8;

/** A row of the action list: one long action, or several short ones side by side. */
export type ActionRow =
  | { kind: "long"; label: string }
  | { kind: "short"; labels: string[] };

export function isShortAction(label: string): boolean {
  return label.length <= SHORT_ACTION_MAX;
}

/** Keeps BeyondATC's order; consecutive short actions share a row. */
export function actionRows(actions: string[]): ActionRow[] {
  const rows: ActionRow[] = [];
  for (const label of actions) {
    const last = rows[rows.length - 1];
    if (!isShortAction(label)) rows.push({ kind: "long", label });
    else if (last && last.kind === "short") last.labels.push(label);
    else rows.push({ kind: "short", labels: [label] });
  }
  return rows;
}
