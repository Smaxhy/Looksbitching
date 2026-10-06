"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXERCISES, describe, type Prescription } from "@/lib/program";
import { useApp } from "@/lib/store";
import { Icon, Modal } from "./ui";
import { Demo } from "./Demo";

interface Phase { kind: "hold" | "rest" | "setrest" | "prep"; secs: number; label: string; sub: string; set: number; rep: number }

const STRETCH_DIRS = ["Out and down toward the chin", "Out and up toward the nose", "Reach to the left corner", "Reach to the right corner"];

function buildPhases(p: Prescription): Phase[] {
  const ex = EXERCISES[p.exercise];
  const out: Phase[] = [{ kind: "prep", secs: 5, label: "Get ready", sub: ex.steps[0], set: 1, rep: 1 }];
  if (p.exercise === "tongue-posture") {
    out.push({ kind: "hold", secs: p.durationSec ?? 60, label: "Hold the posture", sub: "Lips sealed, tongue up, teeth apart, nose breathing, ears over shoulders.", set: 1, rep: 1 });
    return out;
  }
  if (p.exercise === "tongue-stretch") {
    for (let s = 1; s <= p.sets; s++) {
      for (let r = 1; r <= 4; r++) {
        out.push({ kind: "hold", secs: p.holdSec, label: "Stretch", sub: STRETCH_DIRS[r - 1], set: s, rep: r });
        if (r < 4) out.push({ kind: "rest", secs: p.restSec, label: "Relax", sub: "Tongue back in", set: s, rep: r });
      }
      if (s < p.sets) out.push({ kind: "setrest", secs: p.setRestSec, label: "Round done", sub: "Breathe through the nose", set: s, rep: 4 });
    }
    return out;
  }
  const holdSub: Record<string, string> = {
    "hyoid-hold": "Voice box up, tongue pressed to the palate.",
    "chin-tuck": p.note?.startsWith("Resisted") ? "Glide back against your fist or towel." : "Glide the head straight back. Eyes level.",
    "neck-flexor-curl": "Tiny nod, head stays down. Low effort.",
    "tongue-press": "Whole tongue pressed up. Teeth apart.",
  };
  const restSub: Record<string, string> = {
    "hyoid-hold": "Release. Next: swallow, then lift and hold.",
  };
  for (let s = 1; s <= p.sets; s++) {
    for (let r = 1; r <= p.reps; r++) {
      out.push({ kind: "hold", secs: p.holdSec, label: "Hold", sub: holdSub[p.exercise] ?? "", set: s, rep: r });
      if (r < p.reps) out.push({ kind: "rest", secs: p.restSec, label: "Release", sub: restSub[p.exercise] ?? "Relax, breathe", set: s, rep: r });
    }
    if (s < p.sets) out.push({ kind: "setrest", secs: p.setRestSec, label: "Set complete", sub: "Shake out the neck, breathe slowly", set: s, rep: p.reps });
  }
  return out;
}

function beep(freq = 660, ms = 120) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.type = "sine"; g.gain.value = 0.06;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, ms);
  } catch { /* audio blocked */ }
}

export function Runner({ open, onClose, title, items, onComplete }: { open: boolean; onClose: () => void; title: string; items: Prescription[]; onComplete?: () => void }) {
  const { toast } = useApp();
  const [idx, setIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [pi, setPi] = useState(0);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sound, setSound] = useState(true);
  const endAt = useRef(0);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);

  const cur = items[idx];
  const phases = useMemo(() => (cur ? buildPhases(cur) : []), [cur]);

  useEffect(() => {
    if (open) { setIdx(0); setStarted(false); setFinished(false); setRunning(false); setPi(0); }
  }, [open]);

  const loadPhase = useCallback((i: number, run: boolean) => {
    setPi(i);
    const s = phases[i]?.secs ?? 0;
    setLeft(s);
    endAt.current = Date.now() + s * 1000;
    setRunning(run);
  }, [phases]);

  const nextExercise = useCallback(() => {
    if (idx + 1 < items.length) { setIdx(idx + 1); setStarted(false); setRunning(false); }
    else { setFinished(true); setRunning(false); onComplete?.(); beep(880, 300); }
  }, [idx, items.length, onComplete]);

  // tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const rem = Math.max(0, (endAt.current - Date.now()) / 1000);
      setLeft(rem);
      if (rem <= 0) {
        if (pi + 1 < phases.length) {
          const np = phases[pi + 1];
          if (sound) beep(np.kind === "hold" ? 760 : 440);
          if (navigator.vibrate) navigator.vibrate(np.kind === "hold" ? 60 : 25);
          loadPhase(pi + 1, true);
        } else nextExercise();
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, pi, phases, loadPhase, nextExercise, sound]);

  // keep screen awake during a session
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (open && started && running) nav.wakeLock?.request("screen").then((w) => { wake.current = w; }).catch(() => {});
    return () => { wake.current?.release().catch(() => {}); wake.current = null; };
  }, [open, started, running]);

  const start = () => { setStarted(true); if (sound) beep(520); loadPhase(0, true); };
  const togglePause = () => {
    if (running) { setRunning(false); }
    else { endAt.current = Date.now() + left * 1000; setRunning(true); }
  };
  const skip = () => { if (pi + 1 < phases.length) loadPhase(pi + 1, running || true); else nextExercise(); };

  if (!open) return null;

  const done = finished;
  const ex = cur ? EXERCISES[cur.exercise] : null;
  const ph = phases[pi];
  const total = ph?.secs || 1;
  const frac = Math.min(1, Math.max(0, left / total));
  const R = 90, C = 2 * Math.PI * R;
  const tone = ph?.kind === "hold" ? "#8b5cf6" : ph?.kind === "prep" ? "#c4b5fd" : "#10b981";
  const overallDone = phases.length ? pi / phases.length : 0;

  return (
    <Modal open={open} onClose={onClose} title={done ? "Session complete" : title}>
      {done ? (
        <div className="grid place-items-center gap-4 py-8 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-emr/20 text-emr-3"><Icon name="check" size={40} stroke={2.4} /></div>
          <h3 className="text-2xl font-bold">Nice work</h3>
          <p className="max-w-xs text-ink-2">Logged to today. Keep your tongue on the palate and your ears over your shoulders for the rest of the day.</p>
          <button className="btn btn-emr" onClick={onClose}>Done</button>
        </div>
      ) : !started ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="label">Exercise {idx + 1} of {items.length}</div>
              <h3 className="text-xl font-bold">{ex?.name}</h3>
              <p className="text-sm text-ink-2">{cur && describe(cur)}{cur?.note ? ` · ${cur.note}` : ""}</p>
            </div>
          </div>
          {cur && <Demo id={cur.exercise} />}
          <ol className="grid gap-2">
            {ex?.steps.map((s, i) => (
              <li key={i} className="glass-flat flex gap-3 p-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vio/25 text-xs font-bold text-vio-3">{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
          <p className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-[#fde68a]"><b>Safety:</b> {ex?.safety}</p>
          <div className="flex gap-2">
            <button className="btn btn-vio flex-1" onClick={start}><Icon name="play" size={18} /> Start</button>
            {idx + 1 < items.length && <button className="btn" onClick={nextExercise}>Skip</button>}
          </div>
        </div>
      ) : (
        <div className="grid place-items-center gap-4 text-center">
          <div className="label">{ex?.name} · {cur?.exercise === "tongue-posture" ? "1 minute" : `set ${ph?.set}/${cur?.sets}${ph?.kind !== "prep" ? ` · rep ${ph?.rep}/${cur?.exercise === "tongue-stretch" ? 4 : cur?.reps}` : ""}`}</div>
          {cur && <div className="w-full max-w-xs"><Demo id={cur.exercise} compact /></div>}
          <div className="relative grid place-items-center" style={{ width: 220, height: 220 }}>
            {ph?.kind === "hold" && running && <span className="absolute inset-6 rounded-full" style={{ background: `radial-gradient(circle, ${tone}55, transparent 70%)`, animation: "breathe 3s ease-in-out infinite" }} />}
            <svg width="220" height="220" className="-rotate-90" aria-hidden="true">
              <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" />
              <circle cx="110" cy="110" r={R} fill="none" stroke={tone} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: "stroke .2s" }} />
            </svg>
            <div className="absolute grid place-items-center">
              <div className="font-display text-5xl font-extrabold tnum" aria-live="off">{Math.ceil(left)}</div>
              <div className="label" style={{ color: tone }}>{ph?.label}</div>
            </div>
          </div>
          <p className="min-h-[2.5rem] max-w-sm text-sm text-ink-2">{ph?.sub}</p>
          <div className="w-full"><div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-vio to-emr-2" style={{ width: `${overallDone * 100}%` }} /></div></div>
          <div className="flex w-full gap-2">
            <button className="btn btn-vio flex-1" onClick={togglePause}><Icon name={running ? "pause" : "play"} size={18} /> {running ? "Pause" : "Resume"}</button>
            <button className="btn" onClick={skip} aria-label="Skip">Skip</button>
            <button className={`btn ${sound ? "" : "opacity-60"}`} onClick={() => { setSound((s) => !s); toast(sound ? "Sound off" : "Sound on"); }} aria-label="Toggle sound"><Icon name="bell" size={18} /></button>
          </div>
        </div>
      )}
    </Modal>
  );
}
