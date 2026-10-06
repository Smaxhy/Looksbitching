"use client";
import { useRef, useState } from "react";
import { angleAt, craniovertebralAngle } from "@/lib/analysis";
import type { Measures } from "@/lib/types";
import { Icon } from "./ui";
import { MeasureExample } from "./Demo";

type Mode = "cva" | "cma";
interface P { x: number; y: number } // normalised 0..1

const STEPS: Record<Mode, { title: string; points: string[]; help: string }> = {
  cva: {
    title: "Craniovertebral angle (head posture)",
    points: ["C7: the bony bump at the base of the neck", "Tragus: the small flap in front of the ear canal"],
    help: "The angle between the horizontal and the line from C7 to the ear. About 50° or more is typical. Smaller means the head sits forward.",
  },
  cma: {
    title: "Cervicomental angle (chin–neck)",
    points: ["Under the chin where the chin meets the neck", "Deepest point of the neck/chin concavity", "A point further down the front of the neck"],
    help: "The angle at the middle point between the two lines. The classic aesthetic benchmark is 105–120°.",
  },
};

export function Measure({ src, value, onChange }: { src: string; value: Measures; onChange: (m: Measures) => void }) {
  const [mode, setMode] = useState<Mode>("cva");
  const [pts, setPts] = useState<Record<Mode, P[]>>({ cva: [], cma: [] });
  const img = useRef<HTMLImageElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);

  const need = STEPS[mode].points.length;
  const cur = pts[mode];

  const compute = (m: Mode, p: P[]) => {
    const el = img.current;
    if (!el || p.length < STEPS[m].points.length) return undefined;
    const w = el.naturalWidth, h = el.naturalHeight;
    const px = p.map((q) => ({ x: q.x * w, y: q.y * h }));
    return m === "cva" ? craniovertebralAngle(px[0], px[1]) : angleAt(px[0], px[1], px[2]);
  };

  const commit = (m: Mode, p: P[]) => {
    const v = compute(m, p);
    onChange({ ...value, ...(m === "cva" ? { cvaDeg: v } : { cmaDeg: v }) });
  };

  const rel = (e: React.PointerEvent): P => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  const down = (e: React.PointerEvent) => {
    const q = rel(e);
    // grab an existing point if close
    const near = cur.findIndex((p) => Math.hypot(p.x - q.x, p.y - q.y) < 0.04);
    if (near >= 0) { setDrag(near); (e.target as Element).setPointerCapture?.(e.pointerId); return; }
    if (cur.length < need) {
      const next = [...cur, q];
      setPts({ ...pts, [mode]: next });
      commit(mode, next);
    }
  };
  const move = (e: React.PointerEvent) => {
    if (drag == null) return;
    const q = rel(e);
    const next = cur.map((p, i) => (i === drag ? q : p));
    setPts({ ...pts, [mode]: next });
    commit(mode, next);
  };
  const up = () => setDrag(null);

  const reset = () => { setPts({ ...pts, [mode]: [] }); onChange({ ...value, ...(mode === "cva" ? { cvaDeg: undefined } : { cmaDeg: undefined }) }); };

  const val = mode === "cva" ? value.cvaDeg : value.cmaDeg;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-6">
      <div ref={box} className="relative mx-auto w-full max-w-sm touch-none select-none overflow-hidden rounded-2xl border border-line bg-black" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={src} alt="Side profile for measurement" className="block w-full" draggable={false} />
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          {mode === "cva" && cur.length === 2 && <line x1={cur[0].x} y1={cur[0].y} x2={cur[1].x} y2={cur[0].y} stroke="rgba(255,255,255,.5)" strokeWidth="0.003" strokeDasharray="0.012 0.01" />}
          {cur.length > 1 && cur.slice(1).map((p, i) => <line key={i} x1={cur[i].x} y1={cur[i].y} x2={p.x} y2={p.y} stroke="#6ee7b7" strokeWidth="0.005" />)}
        </svg>
        {cur.map((p, i) => (
          <span key={i} className="pointer-events-none absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-vio text-[11px] font-extrabold" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>{i + 1}</span>
        ))}
      </div>
      <div className="grid content-start gap-3">
        <details open={cur.length === 0 && !value.cvaDeg} className="glass-flat p-3 text-sm"><summary className="cursor-pointer font-bold">Where do I tap? (example)</summary><div className="mt-2"><MeasureExample /></div></details>
        <div className="flex gap-1 rounded-xl border border-line bg-white/[0.04] p-1">
          {(["cva", "cma"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${mode === m ? "bg-vio/50 text-white" : "text-ink-3"}`}>{m === "cva" ? "Head posture (CVA)" : "Chin–neck (CMA)"}</button>
          ))}
        </div>
        <div>
          <h4 className="font-bold">{STEPS[mode].title}</h4>
          <p className="text-xs text-ink-3">{STEPS[mode].help}</p>
        </div>
        <ol className="grid gap-1.5 text-sm">
          {STEPS[mode].points.map((t, i) => (
            <li key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${cur.length === i ? "bg-vio/20 text-white" : cur.length > i ? "text-emr-3" : "text-ink-3"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${cur.length > i ? "bg-emr text-[#04140d]" : "bg-white/10"}`}>{i + 1}</span>{t}
            </li>
          ))}
        </ol>
        <div className="glass-flat flex items-center justify-between p-3">
          <div><div className="label">Result</div><div className="font-display text-3xl font-extrabold tnum">{val != null ? `${Math.round(val)}°` : "–"}</div></div>
          <div className="text-right text-xs text-ink-3">{val == null ? "Tap the photo to place points. Drag to adjust." : mode === "cva" ? (val >= 50 ? "Within the typical range" : "Forward-head posture") : val >= 105 && val <= 120 ? "Inside the benchmark" : val > 120 ? "Wider than benchmark" : "Sharper than benchmark"}</div>
        </div>
        <button className="btn btn-sm w-fit" onClick={reset}><Icon name="reset" size={16} /> Clear these points</button>
      </div>
    </div>
  );
}
