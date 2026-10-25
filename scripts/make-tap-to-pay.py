# Makes sounds/tap-to-pay.wav and .m4a: an original two-note "payment complete"
# chime with a soft contactless tick, like the sound a phone makes after a tap
# to pay. Synthesised here, so there is no outside audio to credit.
# Run: python3 scripts/make-tap-to-pay.py   (needs numpy and macOS afconvert)
import subprocess, wave
import numpy as np

RATE = 22050
LEN = 0.72
t = np.arange(int(RATE * LEN)) / RATE
out = np.zeros_like(t)

def bell(freq, start, decay, gain):
    """A glassy bell: a sine with a few slightly detuned partials, fading out."""
    local = np.clip(t - start, 0, None)
    env = np.where(t >= start, np.exp(-local / decay), 0) * np.minimum(local / 0.004, 1)
    tone = sum(g * np.sin(2 * np.pi * freq * m * local) for m, g in ((1, 1.0), (2.01, 0.35), (3.98, 0.12), (5.4, 0.05)))
    return gain * env * tone

# The tick of the phone finding the reader.
tick = np.where(t < 0.018, np.random.default_rng(7).standard_normal(len(t)) * np.exp(-t / 0.004), 0)
out += 0.18 * tick
# Two rising notes, a fifth apart (G6 then D7).
out += bell(1568.0, 0.03, 0.16, 0.55)
out += bell(2349.3, 0.14, 0.22, 0.55)
out *= np.minimum((LEN - t) / 0.06, 1)  # fade the very end, so there is no click
out = out / np.max(np.abs(out)) * 0.7

pcm = (out * 32767).astype("<i2")
with wave.open("sounds/tap-to-pay.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(RATE)
    w.writeframes(pcm.tobytes())
subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "48000", "sounds/tap-to-pay.wav", "sounds/tap-to-pay.m4a"], check=True)
print("made sounds/tap-to-pay.wav and sounds/tap-to-pay.m4a")
