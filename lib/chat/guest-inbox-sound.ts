let audioContext: AudioContext | null = null;
let unlocked = false;

export function unlockGuestInboxAudio() {
  if (typeof window === "undefined" || unlocked) return;

  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    unlocked = true;
  } catch {
    /* ignore */
  }
}

/** Short subtle two-tone chime for new guest queue items. */
export function playGuestInboxSound() {
  if (typeof window === "undefined") return;

  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    const ctx = audioContext;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const tones = [
      { freq: 740, start: 0, duration: 0.12 },
      { freq: 988, start: 0.13, duration: 0.16 },
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = tone.freq;
      gain.gain.setValueAtTime(0.0001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.07, now + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + tone.start + tone.duration
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.duration + 0.02);
    }
  } catch {
    /* autoplay or audio unsupported */
  }
}
