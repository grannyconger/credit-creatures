// What the Vault's tabs do with money. Every action goes through the engine, then the
// run's life is replaced, the choice is tracked and saved, and the tab repaints.
// Shared by Pay Bills, Save for Goals, Manage Debt and Protect Yourself.
import { toast } from "../dom.js";
import { pay, setAutopay, moveToSavings, moveToChecking, removeAuthorizedUser } from "../../engine/index.js";
import { notePayment } from "../../progress.js";
import { sfx } from "../sound.js";

export function vaultActions({ run, track, save, repaint }) {
  const act = async (r, reason, data) => {
    if (!r.ok) return toast(r.message, "bad");
    run.life = r.life;
    track(reason, data);
    // A bill payment is a payment, so it gets the same chime a phone makes after a tap to pay.
    if (reason === "billPay") sfx.tapToPay();
    toast(r.message, "good");
    await save(reason);
    repaint();
  };
  return {
    act,
    onPay: (id, amount, kind) => {
      const r = pay(run.life, id, amount);
      if (r.ok) notePayment(run.play, run.life, id, r.paid);
      return act(r, "billPay", { kind, amount, where: "vault" });
    },
    onMove: (dir, amount) => act(dir === "toSavings" ? moveToSavings(run.life, amount) : moveToChecking(run.life, amount), "moveMoney", { dir, amount }),
    onAutopay: (id, mode) => act(setAutopay(run.life, id, mode), "autopaySet", { mode: mode || "off" }),
    onLeaveParentCard: () => act(removeAuthorizedUser(run.life), "removeAuthorizedUser", {}),
  };
}
