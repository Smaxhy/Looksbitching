"use client";
import { useEffect, useState } from "react";
import type { ExerciseId } from "@/lib/program";

interface Phase { label: string; ms: number }

export const DEMO_PHASES: Record<ExerciseId, Phase[]> = {
  "chin-tuck": [{ label: "Sit tall, eyes level", ms: 1400 }, { label: "Glide the head straight back", ms: 1500 }, { label: "Hold and breathe", ms: 2000 }, { label: "Return slowly", ms: 1400 }],
  "neck-flexor-curl": [{ label: "Lie down, small towel under head", ms: 1500 }, { label: "Tiny nod, like a gentle “yes”", ms: 1500 }, { label: "Hold at 10–20% effort", ms: 2200 }, { label: "Release and rest", ms: 1400 }],
  "hyoid-hold": [{ label: "Tongue flat to the roof", ms: 1400 }, { label: "Swallow: voice box rises", ms: 1300 }, { label: "Hold it up. Squeeze under the chin", ms: 2400 }, { label: "Release and breathe", ms: 1400 }],
  "tongue-posture": [{ label: "Tongue resting low (common)", ms: 1700 }, { label: "Lift the whole tongue to the roof", ms: 1600 }, { label: "Hold: lips closed, teeth apart", ms: 2600 }],
  "tongue-press": [{ label: "Tongue on the roof", ms: 1400 }, { label: "Press up firmly (6–7 / 10)", ms: 2200 }, { label: "Release", ms: 1200 }],
  "tongue-stretch": [{ label: "Out and down toward chin", ms: 1800 }, { label: "Out and up toward nose", ms: 1800 }, { label: "Reach to the left corner", ms: 1800 }, { label: "Reach to the right corner", ms: 1800 }],
};

function useCycle(phases: Phase[]) {
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => { setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false); }, []);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setI((x) => (x + 1) % phases.length), phases[i % phases.length].ms);
    return () => clearTimeout(t);
  }, [i, phases, reduced]);
  return reduced ? 1 : i;
}

const STROKE = "#c4b5fd";
const GLOW = "#34d399";
const HEAD_D = "M86 128 C70 120 60 100 62 78 C64 48 88 28 114 30 C138 32 152 50 152 68 L154 76 L164 92 L156 98 L156 106 L152 110 L156 114 L152 120 C152 132 142 138 130 138 L112 134 C104 134 96 132 86 128 Z";
const move = (x = 0, y = 0, r = 0, ms = 900): React.CSSProperties => ({
  transform: `translate(${x}px, ${y}px) rotate(${r}deg)`, transformOrigin: "100px 130px", transformBox: "view-box", transition: `transform ${ms}ms cubic-bezier(.4,0,.2,1)`,
});

function Defs() {
  return (
    <defs>
      <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a2150" /><stop offset="1" stopColor="#171230" /></linearGradient>
      <linearGradient id="skin2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b2d78" /><stop offset="1" stopColor="#1c1540" /></linearGradient>
      <radialGradient id="glow"><stop offset="0" stopColor={GLOW} stopOpacity=".9" /><stop offset="1" stopColor={GLOW} stopOpacity="0" /></radialGradient>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={GLOW} /></marker>
    </defs>
  );
}

function Body({ head, children }: { head: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <g>
      <path d="M20 222 C28 194 56 188 84 184 L116 184 C144 188 172 194 180 222 Z" fill="url(#skin)" stroke={STROKE} strokeWidth="2" strokeOpacity=".5" />
      <path d="M85 118 L82 188 L122 188 L118 130 Z" fill="url(#skin)" stroke={STROKE} strokeWidth="2" strokeOpacity=".5" />
      {children}
      <g style={head}>
        <path d={HEAD_D} fill="url(#skin2)" stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="94" cy="92" rx="6" ry="10" fill="none" stroke={STROKE} strokeOpacity=".7" strokeWidth="2" />
        <circle cx="140" cy="70" r="2.6" fill="#f2effc" />
        <path d="M150 112 C148 114 146 114 142 113" fill="none" stroke={STROKE} strokeOpacity=".6" strokeWidth="1.6" />
      </g>
    </g>
  );
}

function ChinTuck({ p }: { p: number }) {
  const back = p === 1 || p === 2;
  return (
    <svg viewBox="0 0 200 222" className="h-full w-full" role="img" aria-label="Chin tuck animation">
      <Defs />
      <line x1="100" y1="14" x2="100" y2="214" stroke="#fff" strokeOpacity=".28" strokeDasharray="4 5" />
      <Body head={move(back ? -16 : 0)}>
        <ellipse cx="97" cy="152" rx="9" ry="30" fill="url(#glow)" style={{ opacity: p === 2 ? 1 : p === 1 ? 0.45 : 0, transition: "opacity .6s" }} />
      </Body>
      <path d="M170 98 L150 98" stroke={GLOW} strokeWidth="3" markerEnd="url(#arr)" style={{ opacity: p === 1 ? 1 : 0, transition: "opacity .4s" }} transform="rotate(180 160 98) translate(-10 0)" />
      <text x="100" y="10" textAnchor="middle" fontSize="9" fill="#b9b4d1" fontWeight="700">ear over shoulder</text>
    </svg>
  );
}

function Lying({ p }: { p: number }) {
  const nod = p === 1 || p === 2;
  return (
    <svg viewBox="0 18 280 150" className="h-full w-full" role="img" aria-label="Neck flexor curl animation">
      <Defs />
      <line x1="0" y1="152" x2="280" y2="152" stroke="#fff" strokeOpacity=".25" strokeWidth="2" />
      <rect x="20" y="141" width="50" height="11" rx="5" fill="#6d5bd0" opacity=".85" />
      <text x="45" y="165" textAnchor="middle" fontSize="8" fill="#b9b4d1">folded towel</text>
      <g transform="translate(14 0) rotate(-90 100 110)">
        <Body head={move(0, 0, nod ? 10 : 0, 1000)}>
          <ellipse cx="97" cy="150" rx="9" ry="26" fill="url(#glow)" style={{ opacity: p === 2 ? 1 : p === 1 ? 0.5 : 0, transition: "opacity .6s" }} />
        </Body>
      </g>
      <text x="150" y="40" fontSize="9" fill="#b9b4d1" fontWeight="700">head stays down</text>
    </svg>
  );
}

function Hyoid({ p }: { p: number }) {
  const up = p === 1 || p === 2;
  return (
    <svg viewBox="0 0 200 222" className="h-full w-full" role="img" aria-label="Swallow and hold animation">
      <Defs />
      <Body head={move()}>
        <ellipse cx="124" cy="140" rx="20" ry="12" fill="url(#glow)" style={{ opacity: p === 2 ? 1 : p === 1 ? 0.6 : 0, transition: "opacity .5s" }} />
        <g style={{ transform: `translateY(${up ? -10 : 0}px)`, transition: "transform .8s cubic-bezier(.4,0,.2,1)" }}>
          <rect x="108" y="150" width="14" height="9" rx="4.5" fill={up ? GLOW : "#8b5cf6"} stroke="#fff" strokeOpacity=".7" style={{ transition: "fill .4s" }} />
        </g>
        <path d="M150 150 L124 154" stroke="#b9b4d1" strokeWidth="1" strokeDasharray="3 3" />
        <text x="152" y="154" fontSize="9" fill="#f2effc" fontWeight="700">voice box</text>
        <text x="152" y="165" fontSize="8" fill="#b9b4d1">(hyoid area)</text>
      </Body>
    </svg>
  );
}

const TONGUE_LOW = "M46 120 C58 100 108 106 146 112 C152 118 142 126 120 126 C90 130 62 130 46 120 Z";
const TONGUE_HIGH = "M48 104 C58 84 104 76 140 78 C150 82 148 94 138 98 C102 108 68 114 48 104 Z";

function Mouth({ p, mode }: { p: number; mode: "posture" | "press" }) {
  const high = mode === "press" ? true : p >= 1;
  const press = mode === "press" && p === 1;
  return (
    <svg viewBox="0 0 200 180" className="h-full w-full" role="img" aria-label={mode === "press" ? "Tongue press animation" : "Tongue posture animation"}>
      <Defs />
      <path d="M150 74 C112 52 70 58 40 92" fill="none" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <path d="M150 118 C112 134 70 132 38 124" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" strokeOpacity=".6" />
      <rect x="146" y="64" width="12" height="26" rx="5" fill="#f2effc" opacity=".9" />
      <rect x="146" y="102" width="12" height="22" rx="5" fill="#f2effc" opacity=".6" />
      <path d="M160 60 L160 130" stroke={STROKE} strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" />
      <path d={TONGUE_LOW} fill="#e07a8a" opacity={high ? 0 : 1} style={{ transition: "opacity .7s" }} />
      <path d={TONGUE_HIGH} fill="#e07a8a" opacity={high ? 1 : 0} style={{ transition: "opacity .7s" }} />
      <path d="M150 74 C112 52 70 58 40 92" fill="none" stroke={GLOW} strokeWidth="5" strokeLinecap="round" style={{ opacity: high && (mode === "press" ? press : p === 2) ? 0.9 : 0, transition: "opacity .5s" }} />
      {press && [70, 100, 130].map((x, i) => (
        <path key={x} d={`M${x} 92 L${x} 70`} stroke={GLOW} strokeWidth="3" markerEnd="url(#arr)" style={{ opacity: 1, transform: "translateY(0)", animation: `nudge .9s ease-in-out ${i * 0.12}s infinite alternate` }} />
      ))}
      <text x="14" y="30" fontSize="9" fill="#b9b4d1" fontWeight="700">cross-section, side view</text>
      <text x="150" y="150" textAnchor="middle" fontSize="8.5" fill="#b9b4d1">tip behind front teeth</text>
      <text x="62" y="152" textAnchor="middle" fontSize="8.5" fill="#b9b4d1">back third up too</text>
      <text x="100" y="174" textAnchor="middle" fontSize="8.5" fill={p === 2 && mode === "posture" ? GLOW : "#8a85a6"} fontWeight="700">{mode === "posture" ? "lips sealed · teeth slightly apart · nose breathing" : "teeth apart, jaw relaxed"}</text>
    </svg>
  );
}

function Stretch({ p }: { p: number }) {
  const ang = [0, 180, 90, -90][p];
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Tongue stretch animation">
      <Defs />
      <ellipse cx="100" cy="98" rx="62" ry="80" fill="url(#skin2)" stroke={STROKE} strokeWidth="2.5" />
      <circle cx="78" cy="78" r="4" fill="#f2effc" /><circle cx="122" cy="78" r="4" fill="#f2effc" />
      <path d="M96 92 L100 104 L104 92" fill="none" stroke={STROKE} strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="100" cy="128" rx="20" ry="8" fill="#2b1224" stroke="#f2effc" strokeOpacity=".7" strokeWidth="2" />
      <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: "100px 128px", transformBox: "view-box", transition: "transform .8s cubic-bezier(.4,0,.2,1)" }}>
        <rect x="93" y="126" width="14" height="38" rx="7" fill="#e07a8a" />
      </g>
      {([["Chin", 100, 190], ["Nose", 100, 12], ["Left", 176, 130], ["Right", 24, 130]] as const).map(([l, x, y], i) => (
        <text key={l} x={x} y={y} textAnchor="middle" fontSize="10" fontWeight="800" fill={[0, 1, 2, 3][i] === (p === 0 ? 0 : p === 1 ? 1 : p === 2 ? 2 : 3) ? GLOW : "#6c678a"}>{l}</text>
      ))}
    </svg>
  );
}

export function Demo({ id, compact = false, className = "" }: { id: ExerciseId; compact?: boolean; className?: string }) {
  const phases = DEMO_PHASES[id];
  const p = useCycle(phases);
  const scene =
    id === "chin-tuck" ? <ChinTuck p={p} /> :
    id === "neck-flexor-curl" ? <Lying p={p} /> :
    id === "hyoid-hold" ? <Hyoid p={p} /> :
    id === "tongue-posture" ? <Mouth p={p} mode="posture" /> :
    id === "tongue-press" ? <Mouth p={p} mode="press" /> : <Stretch p={p} />;
  return (
    <figure className={`relative m-0 overflow-hidden rounded-2xl border border-line ${compact ? "[&_text]:hidden" : ""} ${className}`} style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(139,92,246,.22), rgba(7,6,13,.9))" }}>
      <div className={compact ? "h-28" : "h-56 sm:h-64"}>{scene}</div>
      {!compact && (
        <figcaption className="grid gap-2 border-t border-line bg-black/30 px-3 py-2.5">
          <div className="text-sm font-bold text-ink" aria-live="polite">{phases[p].label}</div>
          <div className="flex gap-1">{phases.map((_, i) => <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i === p ? "linear-gradient(90deg,#8b5cf6,#34d399)" : "rgba(255,255,255,.12)", transition: "background .3s" }} />)}</div>
        </figcaption>
      )}
    </figure>
  );
}

/** Forward head vs aligned posture comparison. */
export function PostureCompare() {
  const fig = (shift: number, label: string, ok: boolean) => (
    <figure className="m-0 grid gap-1 text-center">
      <svg viewBox="0 0 200 222" className="mx-auto h-44 w-full">
        <Defs />
        <line x1="100" y1="14" x2="100" y2="214" stroke={ok ? GLOW : "#fb7185"} strokeOpacity=".6" strokeDasharray="4 5" />
        <Body head={move(shift)} />
      </svg>
      <figcaption className={`text-xs font-bold ${ok ? "text-emr-2" : "text-bad"}`}>{label}</figcaption>
    </figure>
  );
  return <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line p-3" style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(139,92,246,.18), rgba(7,6,13,.9))" }}>{fig(18, "Forward head: ear ahead of shoulder", false)}{fig(0, "Aligned: ear over shoulder", true)}</div>;
}

/** Where to tap for the two profile measurements. */
export function MeasureExample() {
  const dot = (x: number, y: number, n: string, c = "#8b5cf6") => <g key={n + x}><circle cx={x} cy={y} r="8" fill={c} stroke="#fff" strokeWidth="2" /><text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{n}</text></g>;
  return (
    <figure className="m-0 overflow-hidden rounded-2xl border border-line" style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(139,92,246,.2), rgba(7,6,13,.9))" }}>
      <svg viewBox="0 0 260 250" className="h-60 w-full">
        <Defs />
        <g transform="translate(30 0)">
          <Body head={move()} />
          <line x1="80" y1="172" x2="130" y2="172" stroke="#fff" strokeOpacity=".4" strokeDasharray="3 4" />
          <path d="M80 172 L96 96" stroke={GLOW} strokeWidth="2" />
          <path d="M132 138 L112 138 L116 176" fill="none" stroke="#fbbf24" strokeWidth="2" />
          {dot(80, 172, "1")}{dot(96, 96, "2")}
          {dot(132, 138, "1", "#d97706")}{dot(112, 138, "2", "#d97706")}{dot(116, 176, "3", "#d97706")}
        </g>
        <text x="130" y="232" textAnchor="middle" fontSize="9.5" fill="#6ee7b7" fontWeight="700">Head posture: 1 C7 bump, 2 ear tragus</text>
        <text x="130" y="246" textAnchor="middle" fontSize="9.5" fill="#fcd34d" fontWeight="700">Chin–neck: 1 under chin, 2 neck dip, 3 down the throat</text>
      </svg>
    </figure>
  );
}
