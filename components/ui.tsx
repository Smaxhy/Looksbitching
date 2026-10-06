"use client";
import { useEffect } from "react";
import type { Grade } from "@/lib/evidence";
import { GRADE_LABEL } from "@/lib/evidence";

const P: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10",
  posture: "M12 3.5a1.8 1.8 0 1 0 0 .01M12 8v6m0 0-3 7m3-7 3 7M8 10.5l4-2.5 4 2.5",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 10v1.5M15 10v1.5M9.5 15c1.4 1.1 3.6 1.1 5 0",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6l.8.8L7 5M4.5 12l.8.8L7 11M4.5 18l.8.8L7 17",
  flame: "M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-1.7.7-3 1.8-4 .2 1.5 1 2.2 1.7 2.5C10.2 8.5 10.7 5.5 12 3Z",
  drop: "M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5Z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  bell: "M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15L6 17ZM10 21h4",
  check: "m5 12.5 4.5 4.5L19 7.5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  play: "M8 5.5v13l11-6.5-11-6.5Z",
  pause: "M8 5v14M16 5v14",
  x: "M6 6l12 12M18 6 6 18",
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4V8ZM12 11a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 11Z",
  upload: "M12 16V4m0 0-4 4m4-4 4 4M5 15v4h14v-4",
  chev: "m9 6 6 6-6 6",
  info: "M12 11v5.5M12 7.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5v1a3 3 0 0 0 3.5 3M16 6h3.5v1a3 3 0 0 1-3.5 3M12 13v4M8.5 20h7M10 17h4",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  plus: "M12 5v14M5 12h14",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  book: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15ZM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3",
  ruler: "M4 16 16 4l4 4L8 20l-4-4ZM8 12l2 2M11 9l2 2M14 6l2 2",
  swap: "M7 8h12m0 0-3-3m3 3-3 3M17 16H5m0 0 3-3m-3 3 3 3",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z",
  zap: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  moonStar: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  scale: "M5 6h14l-1.5 12h-11L5 6ZM9 6a3 3 0 0 1 6 0M12 10l1.5 3",
  reset: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4",
};

export function Icon({ name, size = 20, className = "", stroke = 1.8 }: { name: keyof typeof P | string; size?: number; className?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={P[name] ?? P.info} />
    </svg>
  );
}

export function Ring({ value, size = 96, stroke = 9, tone = "emr", children }: { value: number; size?: number; stroke?: number; tone?: "emr" | "vio"; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.min(1, Math.max(0, value));
  const id = `rg-${tone}-${size}`;
  const [a, b] = tone === "emr" ? ["#6ee7b7", "#10b981"] : ["#c4b5fd", "#8b5cf6"];
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Bar({ value, tone = "emr", h = 8 }: { value: number; tone?: "emr" | "vio"; h?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/[0.07]" style={{ height: h }} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%`, background: tone === "emr" ? "linear-gradient(90deg,#10b981,#6ee7b7)" : "linear-gradient(90deg,#7c3aed,#c4b5fd)", transition: "width .5s ease" }} />
    </div>
  );
}

export function GradeChip({ grade }: { grade: Grade }) {
  const cls = grade === "strong" || grade === "moderate" ? "chip-emr" : grade === "limited" ? "chip-warn" : "chip-bad";
  return <span className={`chip ${cls}`}>{GRADE_LABEL[grade]}</span>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`glass rise flex max-h-[92dvh] w-full flex-col rounded-b-none sm:rounded-b-[1.25rem] ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`} style={{ background: "linear-gradient(180deg,#171326,#0e0b1a)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4" style={{ paddingBottom: "calc(1.25rem + var(--safe-b))" }}>{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="label mb-1">{eyebrow}</div>}
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Toasts({ toasts }: { toasts: { id: number; msg: string }[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ top: "calc(var(--safe-t) + 4.5rem)" }}>
      {toasts.map((t) => (
        <div key={t.id} className="glass rise pointer-events-auto max-w-md px-4 py-2.5 text-sm font-semibold" style={{ background: "rgba(24,19,42,.92)" }}>{t.msg}</div>
      ))}
    </div>
  );
}
