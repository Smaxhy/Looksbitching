"use client";
import { useRef, useState } from "react";
import { angleAt, craniovertebralAngle } from "@/lib/analysis";
import type { Measures } from "@/lib/types";
import { Icon } from "./ui";
import { MeasureExample } from "./Demo";

interface P { x: number; y: number } // normalised 0..1
type Mode = "cva" | "cma" | "gonial" | "nasolabial" | "convexity";

interface Spec { key: Mode; field: keyof Measures; tab: string; title: string; points: string[]; help: string; ref: string; calc: (p: P[]) => number; guide: boolean }

const SPECS: Spec[] = [
  { key: "cva", field: "cvaDeg", tab: "Head posture", title: "Craniovertebral angle (head posture)", guide: false,
    points: ["C7: the bony bump at the base of the neck", "Tragus: the small flap in front of the ear canal"],
    help: "The angle between the horizontal and the line from C7 to the ear. About 50° or more is typical. Smaller means the head sits forward.", ref: "≥ 50° typical",
    calc: (p) => craniovertebralAngle(p[0], p[1]) },
  { key: "cma", field: "cmaDeg", tab: "Chin–neck", title: "Cervicomental angle (chin–neck)", guide: false,
    points: ["Under the chin where the chin meets the neck", "Deepest point of the neck/chin concavity", "A point further down the front of the neck"],
    help: "The angle at the middle point between the two lines. The classic aesthetic benchmark is 105–120°.", ref: "105–120° benchmark",
    calc: (p) => angleAt(p[0], p[1], p[2]) },
  { key: "gonial", field: "gonialDeg", tab: "Jaw angle", title: "Jaw angle (gonial angle)", guide: false,
    points: ["Back of the jaw, up toward the earlobe (along the vertical jaw bone)", "The corner of the jaw (gonion)", "The bottom of the chin (menton)"],
    help: "The angle at the jaw corner between the vertical jaw bone and the underside of the jaw. Smaller is more angular. Soft tissue can blur the real corner, so tap where you can see the edge.", ref: "about 115–130° typical",
    calc: (p) => angleAt(p[0], p[1], p[2]) },
  { key: "nasolabial", field: "nasolabialDeg", tab: "Nose–lip", title: "Nasolabial angle (nose tip rotation)", guide: false,
    points: ["Just above the base of the nose (the columella, along the nose underside)", "The point where the nose meets the upper lip (subnasale)", "The middle of the upper lip's edge"],
    help: "The angle at the nose–lip corner. Roughly 90–110° is typical.", ref: "90–110° typical",
    calc: (p) => angleAt(p[0], p[1], p[2]) },
  { key: "convexity", field: "convexityDeg", tab: "Profile line", title: "Profile convexity (forehead–nose–chin)", guide: false,
    points: ["Glabella: the smooth spot between the brows", "Subnasale: where the nose meets the upper lip", "Pogonion: the most forward point of the chin"],
    help: "The angle at the middle point. A straight to gently convex profile is about 160–175°. Lower values mean the chin sits further back.", ref: "160–175° typical",
    calc: (p) => angleAt(p[0], p[1], p[2]) },
];

export function Measure({ src, value, onChange }: { src: string; value: Measures; onChange: (m: Measures) => void }) {
  const [mode, setMode] = useState<Mode>("cva");
  const [pts, setPts] = useState<Record<Mode, P[]>>({ cva: [], cma: [], gonial: [], nasolabial: [], convexity: [] });
  const img = useRef<HTMLImageElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);

  const spec = SPECS.find((s) => s.key === mode)!;
  const need = spec.points.length;
  const cur = pts[mode];

  const commit = (s: Spec, p: P[]) => {
    const el = img.current;
    if (!el || p.length < s.points.length) { onChange({ ...value, [s.field]: undefined }); return; }
    const px = p.map((q) => ({ x: q.x * el.naturalWidth, y: q.y * el.naturalHeight }));
    onChange({ ...value, [s.field]: s.calc(px) });
  };

  const rel = (e: React.PointerEvent): P => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const down = (e: React.PointerEvent) => {
    const q = rel(e);
    const near = cur.findIndex((p) => Math.hypot(p.x - q.x, p.y - q.y) < 0.04);
    if (near >= 0) { setDrag(near); (e.target as Element).setPointerCapture?.(e.pointerId); return; }
    if (cur.length < need) { const next = [...cur, q]; setPts({ ...pts, [mode]: next }); commit(spec, next); }
  };
  const move = (e: React.PointerEvent) => {
    if (drag == null) return;
    const q = rel(e);
    const next = cur.map((p, i) => (i === drag ? q : p));
    setPts({ ...pts, [mode]: next }); commit(spec, next);
  };
  const up = () => setDrag(null);
  const reset = () => { setPts({ ...pts, [mode]: [] }); onChange({ ...value, [spec.field]: undefined }); };
  const val = value[spec.field];
  const doneCount = SPECS.filter((s) => value[s.field] != null).length;

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
        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-white/[0.04] p-1">
          {SPECS.map((s) => (
            <button key={s.key} onClick={() => setMode(s.key)} className={`flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-bold ${mode === s.key ? "bg-vio/50 text-white" : "text-ink-3"}`}>
              {value[s.field] != null && <span className="mr-1 text-emr-2">✓</span>}{s.tab}
            </button>
          ))}
        </div>
        <details open={cur.length === 0 && doneCount === 0} className="glass-flat p-3 text-sm"><summary className="cursor-pointer font-bold">Where do I tap? (example)</summary><div className="mt-2"><MeasureExample /></div></details>
        <div>
          <h4 className="font-bold">{spec.title}</h4>
          <p className="text-xs text-ink-3">{spec.help}</p>
        </div>
        <ol className="grid gap-1.5 text-sm">
          {spec.points.map((t, i) => (
            <li key={i} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${cur.length === i ? "bg-vio/20 text-white" : cur.length > i ? "text-emr-3" : "text-ink-3"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${cur.length > i ? "bg-emr text-[#04140d]" : "bg-white/10"}`}>{i + 1}</span>{t}
            </li>
          ))}
        </ol>
        <div className="glass-flat flex items-center justify-between p-3">
          <div><div className="label">Result</div><div className="font-display text-3xl font-extrabold tnum">{val != null ? `${Math.round(val)}°` : "–"}</div></div>
          <div className="text-right text-xs text-ink-3">{val == null ? "Tap the photo to place points. Drag to adjust." : spec.ref}</div>
        </div>
        <button className="btn btn-sm w-fit" onClick={reset}><Icon name="reset" size={16} /> Clear these points</button>
        <p className="text-[11px] text-ink-3">Each angle you add makes the report richer. {doneCount}/5 done. Skip any you are unsure about.</p>
      </div>
    </div>
  );
}
