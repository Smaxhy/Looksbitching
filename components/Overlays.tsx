"use client";
import { useState } from "react";
import type { FrontMetrics, PoseFront, PoseSide } from "@/lib/types";

type Layer = "proportion" | "eyes" | "nose" | "jaw";
const LAYERS: { id: Layer; label: string; color: string }[] = [
  { id: "proportion", label: "Proportions", color: "#a78bfa" },
  { id: "eyes", label: "Eyes & brows", color: "#34d399" },
  { id: "nose", label: "Nose & lips", color: "#fbbf24" },
  { id: "jaw", label: "Jaw & cheeks", color: "#fb7185" },
];

export function FaceMap({ src, f }: { src: string; f: FrontMetrics }) {
  const [on, setOn] = useState<Record<Layer, boolean>>({ proportion: true, eyes: true, nose: false, jaw: true });
  const W = f.imgW, H = f.imgH;
  const P = (i: number): [number, number] => [(f.lm[i]?.[0] ?? 0) * W, (f.lm[i]?.[1] ?? 0) * H];
  const sw = W / 260;
  const line = (a: number, b: number, c: string, dash?: boolean, key?: string) => {
    const [x1, y1] = P(a), [x2, y2] = P(b);
    return <line key={key ?? `${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={sw} strokeDasharray={dash ? `${sw * 4} ${sw * 3}` : undefined} strokeLinecap="round" />;
  };
  const dots = (ids: number[], c: string) => ids.map((i) => { const [x, y] = P(i); return <circle key={i} cx={x} cy={y} r={sw * 1.6} fill={c} stroke="#07060d" strokeWidth={sw * 0.5} />; });
  const hline = (i: number, c: string, key: string) => { const [, y] = P(i); const [xl] = P(234), [xr] = P(454); const pad = (xr - xl) * 0.25; return <line key={key} x1={xl - pad} x2={xr + pad} y1={y} y2={y} stroke={c} strokeWidth={sw} strokeDasharray={`${sw * 5} ${sw * 4}`} opacity=".85" />; };
  const jaw = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454];
  const jawPath = jaw.map((i, k) => `${k ? "L" : "M"}${P(i)[0]} ${P(i)[1]}`).join(" ");
  return (
    <div className="grid content-start gap-3">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-line bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Front photo with measurement overlay" className="block w-full" />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {on.proportion && <g>
            {hline(9, "#a78bfa", "t1")}{hline(2, "#a78bfa", "t2")}{hline(152, "#a78bfa", "t3")}
            {line(10, 152, "rgba(255,255,255,.45)", true, "mid")}
          </g>}
          {on.eyes && <g>
            {line(33, 133, "#34d399")}{line(362, 263, "#34d399")}{line(468, 473, "#34d399", true, "ipd")}
            {line(55, 46, "#6ee7b7")}{line(285, 276, "#6ee7b7")}
            {dots([468, 473, 33, 133, 362, 263], "#34d399")}
          </g>}
          {on.nose && <g>
            {line(129, 358, "#fbbf24")}{line(61, 291, "#fbbf24")}{line(0, 13, "#fcd34d")}{line(14, 17, "#fcd34d")}
            {dots([129, 358, 61, 291, 2], "#fbbf24")}
          </g>}
          {on.jaw && <g>
            <path d={jawPath} fill="none" stroke="#fb7185" strokeWidth={sw * 1.2} strokeLinejoin="round" />
            {line(234, 454, "#fda4af", true, "bz")}{line(172, 397, "#fb7185", false, "bg")}
            {dots([234, 454, 172, 397, 152], "#fb7185")}
          </g>}
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {LAYERS.map((l) => (
          <button key={l.id} aria-pressed={on[l.id]} onClick={() => setOn({ ...on, [l.id]: !on[l.id] })} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${on[l.id] ? "border-white/30 bg-white/10 text-white" : "border-line text-ink-3"}`}>
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: l.color, opacity: on[l.id] ? 1 : 0.35 }} />{l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BodyMap({ src, kind, front, side }: { src: string; kind: "front" | "side"; front?: PoseFront; side?: PoseSide }) {
  const pts = (kind === "front" ? front?.pts : side?.pts) ?? {};
  const [dims, setDims] = useState<[number, number]>([1, 1]);
  const W = dims[0], H = dims[1];
  const P = (i: number): [number, number] => [(pts[i]?.[0] ?? 0) * W, (pts[i]?.[1] ?? 0) * H];
  const sw = W / 220;
  const L = (a: number, b: number, c: string, dash?: boolean) => { const [x1, y1] = P(a), [x2, y2] = P(b); return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={sw * 1.4} strokeDasharray={dash ? `${sw * 5} ${sw * 4}` : undefined} strokeLinecap="round" />; };
  const D = (ids: number[], c: string) => ids.map((i) => { const [x, y] = P(i); return <circle key={i} cx={x} cy={y} r={sw * 2.2} fill={c} stroke="#07060d" strokeWidth={sw * 0.6} />; });
  const earIdx = side ? (pts[7] && pts[11] && (side.facing === 1 ? true : true) ? 7 : 8) : 7;
  const e = (pts[earIdx] ? earIdx : 8), s = pts[11] ? 11 : 12, h = pts[23] ? 23 : 24;
  const [sx] = P(s);
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${kind} body photo with pose overlay`} className="block w-full" onLoad={(ev) => setDims([ev.currentTarget.naturalWidth, ev.currentTarget.naturalHeight])} />
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {kind === "front" ? <g>{L(12, 11, "#34d399")}{L(24, 23, "#a78bfa")}{L(8, 7, "#fbbf24")}{L(11, 23, "rgba(255,255,255,.4)", true)}{L(12, 24, "rgba(255,255,255,.4)", true)}{L(23, 25, "rgba(255,255,255,.4)")}{L(24, 26, "rgba(255,255,255,.4)")}{L(25, 27, "rgba(255,255,255,.4)")}{L(26, 28, "rgba(255,255,255,.4)")}{D([11, 12, 23, 24, 7, 8], "#c4b5fd")}</g>
          : <g><line x1={sx} x2={sx} y1={0} y2={H} stroke="rgba(255,255,255,.5)" strokeWidth={sw} strokeDasharray={`${sw * 5} ${sw * 4}`} />{L(e, s, "#fbbf24")}{L(s, h, "#34d399")}{D([e, s, h], "#c4b5fd")}</g>}
      </svg>
    </div>
  );
}
