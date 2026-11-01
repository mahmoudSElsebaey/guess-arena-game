import { useCallback, useEffect, useRef, useState } from "react";

export type GameSound = "click" | "question" | "yes" | "no" | "eliminate" | "turn" | "win" | "lose";

const tones: Record<GameSound, Array<{ frequency: number; duration: number; delay: number; type?: OscillatorType }>> = {
  click: [{ frequency: 520, duration: 0.045, delay: 0 }],
  question: [{ frequency: 620, duration: 0.07, delay: 0 }, { frequency: 780, duration: 0.09, delay: 0.075 }],
  yes: [{ frequency: 660, duration: 0.08, delay: 0 }, { frequency: 880, duration: 0.12, delay: 0.08 }],
  no: [{ frequency: 420, duration: 0.09, delay: 0 }, { frequency: 330, duration: 0.12, delay: 0.09 }],
  eliminate: [{ frequency: 300, duration: 0.07, delay: 0, type: "triangle" }, { frequency: 220, duration: 0.1, delay: 0.055, type: "triangle" }],
  turn: [{ frequency: 560, duration: 0.07, delay: 0 }, { frequency: 700, duration: 0.07, delay: 0.09 }],
  win: [{ frequency: 523, duration: 0.12, delay: 0 }, { frequency: 659, duration: 0.12, delay: 0.13 }, { frequency: 784, duration: 0.2, delay: 0.26 }],
  lose: [{ frequency: 392, duration: 0.13, delay: 0 }, { frequency: 311, duration: 0.18, delay: 0.14 }]
};

export function useGameSounds() {
  const [enabled, setEnabled] = useState(true);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("guess-arena:sound");
      if (saved === "off") setEnabled(false);
      if (saved === "on") setEnabled(true);
    } catch { /* Storage may be unavailable; keep the default. */ }
  }, []);

  const toggle = useCallback(() => {
    setEnabled(current => {
      const next = !current;
      try { window.localStorage.setItem("guess-arena:sound", next ? "on" : "off"); } catch { /* Ignore storage restrictions. */ }
      return next;
    });
  }, []);

  const play = useCallback((sound: GameSound) => {
    if (!enabled || typeof window === "undefined") return;
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      const context = contextRef.current ?? new AudioContextConstructor();
      contextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const now = context.currentTime;
      for (const tone of tones[sound]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + tone.delay;
        oscillator.type = tone.type ?? "sine";
        oscillator.frequency.setValueAtTime(tone.frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + tone.duration + 0.015);
      }
    } catch { /* Audio is an enhancement; never interrupt gameplay. */ }
  }, [enabled]);

  useEffect(() => () => {
    if (contextRef.current && contextRef.current.state !== "closed") void contextRef.current.close();
  }, []);

  return { soundEnabled: enabled, toggleSound: toggle, playSound: play };
}
