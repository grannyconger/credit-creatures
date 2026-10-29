// The Cottage photo frame: a student picks a picture from their device, the game shrinks it
// to a small JPEG and keeps it in their own save (play.photo). Nothing is sent anywhere but
// the student's own save, and no one else sees the room.
import { h, toast } from "./dom.js";
import { icon } from "./icons.js";
import { PHOTO_MAX_CHARS, validPhoto } from "../data/cottage.js";

const LONG_SIDE = 720;

// Shrinks an image file to a JPEG data URL under the size limit. Rejects if it can't be read.
export async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  for (let q = 0.85; q >= 0.4; q -= 0.15) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= PHOTO_MAX_CHARS) return url;
  }
  throw new Error("too big");
}

// onChange runs after the photo is saved or taken down, so the room can repaint.
export function openPhotoFrame({ game, play, track, onChange }) {
  let draft = validPhoto(play.photo);
  const dialog = h("dialog.photo-dialog.bst-scope", { "aria-labelledby": "photo-title" });
  const picture = h("div.photo-view");
  const note = h("p.note.tight", { "aria-live": "polite" });
  const file = h("input", { type: "file", accept: "image/*", class: "photo-file", hidden: true, tabindex: "-1" });
  const save = h("button", { type: "button" }, icon("check", { size: 18 }), " Hang it up");
  const remove = h("button.secondary", { type: "button" }, "Take it down");
  const close = () => (dialog.close(), dialog.remove());

  const paint = () => {
    picture.replaceChildren(draft ? h("img", { src: draft, alt: "Your photo in its frame" }) : h("p.muted", "The frame is empty. Choose a photo to hang in it."));
    save.disabled = !draft || draft === validPhoto(play.photo);
    remove.disabled = !validPhoto(play.photo) && !draft;
  };

  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    note.textContent = "Getting your photo ready...";
    try {
      draft = await shrinkPhoto(f);
      note.textContent = "Looks good. Hang it up when you like it.";
      track("photoPicked", { kb: Math.round(draft.length / 1024) });
    } catch {
      note.textContent = "That picture couldn't be used. Try a JPG or PNG photo.";
    }
    paint();
  });
  save.addEventListener("click", async () => {
    play.photo = draft;
    track("photoHung", { kb: Math.round(draft.length / 1024) });
    await game.persist("photo");
    toast("Your photo is on the wall.", "good");
    onChange?.();
    close();
  });
  remove.addEventListener("click", async () => {
    play.photo = null;
    draft = null;
    track("photoRemoved", {});
    await game.persist("photo");
    onChange?.();
    close();
  });
  dialog.addEventListener("cancel", close);
  dialog.append(
    h("h2", { id: "photo-title" }, icon("camera", { size: 22 }), " Your photo frame"),
    picture,
    note,
    h("div.row", h("button.secondary", { type: "button", onclick: () => file.click() }, icon("plus", { size: 18 }), " Choose a photo"), file, save, remove, h("button.secondary", { type: "button", onclick: close }, "Close")),
    h("p.note.tight", "Pick a picture that is fine for the whole class to see. It stays on your device and in your own game save. Only you see your room.")
  );
  paint();
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
