// The Hall of Records (Phase 10, Chapter 4): the credit bureau of Coinhaven.
// It keeps your credit report and your credit score.
import { tabbedPlace, RECORDS_TABS } from "./accounts.js";

export function render(root, ctx) {
  return tabbedPlace(root, ctx, {
    tabs: RECORDS_TABS,
    stateKey: "recordsTab",
    iconName: "scroll",
    title: "Hall of Records",
    subtitle: "The kingdom's credit bureau. Lenders report here every month, and it keeps your score.",
  });
}
