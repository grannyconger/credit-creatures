// The Hall of Records is part of the Vault now (2026-10-25): the credit score and report
// live under Build Credit. This keeps old links, lessons and bookmarks working by
// sending them there.
import { openVaultTab } from "./accounts.js";

export function render(root, { game, go, track }) {
  openVaultTab(game, "credit", "score");
  track("accountsTab", { tab: "credit", sub: "score" });
  go("accounts");
}
