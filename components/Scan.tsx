"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { useData } from "./data";
import { Capture } from "./Capture";
import { Measure } from "./Measure";
import { Bar, GradeChip, Icon, Ring, SectionTitle } from "./ui";
import { analyzeFront, buildActions, buildResult, DEFAULT_SELF, NoFaceError } from "@/lib/analysis";
import { sleepAvg7d, waterRatio7d } from "@/lib/habits";
import { STUDIES } from "@/lib/evidence";
import { uid } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import type { FrontMetrics, Measures, ScanResult, SelfAssessment } from "@/lib/types";

type Step = "home" | "front" | "side" | "measure" | "self" | "busy" | "result";

export function Scan() {
  const { state, day, today } = useApp();
  const { scans } = useData();
  const [step, setStep] = useState<Step>("home");
  const [front, setFront] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [measures, setMeasures] = useState<Measures>({});
  const [self, setSelf] = useState<SelfAssessment>(DEFAULT_SELF);
  const [viewId, setViewId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const view = scans.find((s) => s.id === viewId) ?? scans[scans.length - 1];
  void state; void day; void today;

  const begin = () => { setFront(null); setSide(null); setMeasures({}); setSelf(DEFAULT_SELF); setNote(""); setStep("front"); };

  if (step === "home") {
    return <Home onNew={begin} onOpen={(id) => { setViewId(id); setStep("result"); }} />;
  }
  if (step === "result" && view) return <Result scan={view} onBack={() => setStep("home")} onNew={begin} />;
  return (
    <Wizard
      step={step} setStep={setStep} front={front} side={side} setFront={setFront} setSide={setSide}
      measures={measures} setMeasures={setMeasures} self={self} setSelf={setSelf} note={note} setNote={setNote}
      onDone={(id) => { setViewId(id); setStep("result"); }}
    />
  );
}

function Home({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { scans, loaded } = useData();
  const { day } = useApp();
  return (
    <div className="grid gap-5">
      <section className="glass relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-emr/20 blur-3xl" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="label">Facial aesthetics evaluator</div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Scan and rate</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-2">Front and side photos are analysed on this device with a face-landmark model. You get four 1–10 scores with the reasoning shown, plus an action list. Treat the numbers as a consistent yardstick for your own progress, not a verdict.</p>
            <div className="mt-3 flex flex-wrap gap-2"><span className="chip chip-emr"><Icon name="lock" size={13} /> Never uploaded</span><span className="chip">Scan on days 1, 30, 60</span><span className="chip">Same light, same distance</span></div>
          </div>
          <button className="btn btn-emr md:self-center" onClick={onNew}><Icon name="camera" size={18} /> {scans.length ? "New scan" : "Start baseline scan"} {day >= 1 && day <= 60 ? `(Day ${day})` : ""}</button>
        </div>
      </section>

      {scans.length > 0 && <Trend scans={scans} />}

      <section className="grid gap-3">
        <SectionTitle eyebrow="History" title={scans.length ? "Your scans" : "No scans yet"} />
        {!loaded && <p className="text-sm text-ink-3">Loading…</p>}
        {loaded && scans.length === 0 && <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-ink-2">Your first scan becomes the baseline. After it you will see score changes, a trend chart and a personalised glow-up list here.</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          {[...scans].reverse().map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)} className="glass flex items-center gap-4 p-4 text-left transition hover:border-vio-2/40">
              <Ring value={s.overall / 10} size={64} stroke={7}><span className="text-lg font-extrabold tnum">{s.overall.toFixed(1)}</span></Ring>
              <div className="min-w-0 flex-1"><div className="font-bold">Day {s.day} scan</div><div className="text-xs text-ink-3">{fmtDate(s.dateKey, { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className="mt-1 flex gap-2 text-[11px] text-ink-2 tnum">{s.categories.map((c) => <span key={c.key}>{c.label.split(/[ ,&]/)[0]} {c.score.toFixed(1)}</span>)}</div></div>
              <Icon name="chev" size={18} className="text-ink-3" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Trend({ scans }: { scans: ScanResult[] }) {
  const W = 640, H = 220, L = 36, R = 20, T = 18, B = 34;
  const maxDay = Math.max(60, ...scans.map((s) => s.day));
  const x = (d: number) => L + ((d - 1) / (maxDay - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - 1) / 9) * (H - T - B);
  const pts = scans.map((s) => [x(s.day), y(s.overall)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1][0]} ${H - B} L${pts[0][0]} ${H - B} Z` : "";
  const first = scans[0], last = scans[scans.length - 1];
  const delta = last.overall - first.overall;
  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SectionTitle eyebrow="Overall score" title="Trend across the 60 days" />
        {scans.length > 1 && <span className={`chip ${delta >= 0 ? "chip-emr" : "chip-bad"}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)} since day {first.day}</span>}
      </div>
      <div className="mt-3 overflow-x-auto"><svg viewBox={`0 0 ${W} ${H}`} className="min-w-[420px] w-full" role="img" aria-label="Overall score by scan day">
        <defs><linearGradient id="trend" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10b981" stopOpacity=".35" /><stop offset="1" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
        {[2, 4, 6, 8, 10].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.07)" /><text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8a85a6">{v}</text></g>)}
        {[1, 30, 60].map((d) => <text key={d} x={x(d)} y={H - 10} textAnchor="middle" fontSize="11" fill="#8a85a6">Day {d}</text>)}
        {area && <path d={area} fill="url(#trend)" />}
        <path d={line} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? "#6ee7b7" : "#07060d"} stroke="#34d399" strokeWidth="2" />)}
        {pts.length > 0 && <text x={Math.min(pts[pts.length - 1][0], W - R - 14)} y={pts[pts.length - 1][1] - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#f2effc">{last.overall.toFixed(1)}</text>}
      </svg></div>
    </section>
  );
}

// ───────────────────────── wizard ─────────────────────────

function Choice<T extends number>({ id, label, value, options, onChange, hint }: { id: string; label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; hint?: string }) {
  return (
    <div className="grid gap-1.5" role="radiogroup" aria-labelledby={id}>
      <div id={id} className="text-sm font-bold">{label}{hint && <span className="ml-2 text-xs font-medium text-ink-3">{hint}</span>}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${value === o.v ? "border-vio-2 bg-vio/30 text-white" : "border-line bg-white/[0.04] text-ink-2 hover:bg-white/10"}`}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

function Wizard(p: {
  step: Step; setStep: (s: Step) => void; front: string | null; side: string | null; setFront: (s: string | null) => void; setSide: (s: string | null) => void;
  measures: Measures; setMeasures: (m: Measures) => void; self: SelfAssessment; setSelf: (s: SelfAssessment) => void; note: string; setNote: (s: string) => void; onDone: (id: string) => void;
}) {
  const { state, day, today, toast } = useApp();
  const { addPhoto, addScan } = useData();
  const { step, setStep, front, side, self, setSelf, measures } = p;

  const stepsList: Step[] = ["front", "side", "measure", "self"];
  const idx = stepsList.indexOf(step);

  const run = async () => {
    setStep("busy");
    let fm: FrontMetrics | undefined;
    let msg = "";
    if (front) {
      try {
        const img = new Image();
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("img")); img.src = front; });
        fm = await analyzeFront(img);
      } catch (e) {
        msg = e instanceof NoFaceError ? "No face was detected in the front photo, so photo-based metrics were skipped. Retake in even light facing the camera." : "The on-device face model could not load, so photo-based metrics were skipped.";
      }
    }
    const frontId = front ? uid() : undefined, sideId = side ? uid() : undefined;
    const d = Math.min(60, Math.max(1, day));
    const ctx = { waterRatio7d: waterRatio7d(state.logs, state.settings, today), sleepAvg7d: sleepAvg7d(state.logs, today) };
    const res = buildResult({ id: uid(), dateKey: today, day: d, frontId, sideId, front: fm, measures, self, ctx });
    const ts = Date.now();
    if (front && frontId) await addPhoto({ id: frontId, ts, dateKey: today, day: d, kind: "front", dataUrl: front });
    if (side && sideId) await addPhoto({ id: sideId, ts, dateKey: today, day: d, kind: "side", dataUrl: side });
    await addScan(res);
    if (msg) toast(msg);
    p.onDone(res.id);
  };

  if (step === "busy") return <div className="glass grid place-items-center gap-3 p-12 text-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-vio/30 border-t-vio-2" /><b>Analysing on your device…</b><span className="text-sm text-ink-3">The first run loads a 4 MB face model.</span></div>;

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <button className="btn btn-sm" onClick={() => setStep("home")}>Cancel</button>
        <div className="flex items-center gap-1.5" aria-label="Progress">{stepsList.map((s, i) => <span key={s} className={`h-1.5 w-9 rounded-full ${i <= idx ? "bg-gradient-to-r from-vio to-emr-2" : "bg-white/10"}`} />)}</div>
        <span className="label tnum">{idx + 1}/4</span>
      </div>

      {step === "front" && (
        <section className="glass grid gap-4 p-5">
          <SectionTitle eyebrow="Step 1" title="Front photo" />
          {front ? (
            <div className="grid gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={front} alt="Front photo" className="mx-auto max-h-[28rem] rounded-2xl border border-line" />
              <div className="flex justify-center gap-2"><button className="btn" onClick={() => p.setFront(null)}>Retake</button><button className="btn btn-vio" onClick={() => setStep("side")}>Use photo <Icon name="chev" size={16} /></button></div>
            </div>
          ) : <Capture kind="front" onCapture={(d) => p.setFront(d)} />}
          {!front && <button className="btn btn-ghost btn-sm mx-auto" onClick={() => setStep("side")}>Skip front photo</button>}
        </section>
      )}

      {step === "side" && (
        <section className="glass grid gap-4 p-5">
          <SectionTitle eyebrow="Step 2" title="Side profile photo" />
          {side ? (
            <div className="grid gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={side} alt="Side photo" className="mx-auto max-h-[28rem] rounded-2xl border border-line" />
              <div className="flex justify-center gap-2"><button className="btn" onClick={() => p.setSide(null)}>Retake</button><button className="btn btn-vio" onClick={() => setStep("measure")}>Measure angles <Icon name="chev" size={16} /></button></div>
            </div>
          ) : <Capture kind="side" onCapture={(d) => p.setSide(d)} />}
          <div className="flex justify-center gap-2"><button className="btn btn-ghost btn-sm" onClick={() => setStep("front")}>Back</button>{!side && <button className="btn btn-ghost btn-sm" onClick={() => setStep("self")}>Skip side photo</button>}</div>
        </section>
      )}

      {step === "measure" && side && (
        <section className="glass grid gap-4 p-5">
          <SectionTitle eyebrow="Step 3" title="Measure your profile" />
          <p className="text-sm text-ink-2">These two angles are the most informative numbers in the scan, and you place them yourself so lighting and hair do not fool the model. Skip any you are unsure about.</p>
          <Measure src={side} value={measures} onChange={p.setMeasures} />
          <div className="flex justify-between"><button className="btn" onClick={() => setStep("side")}>Back</button><button className="btn btn-vio" onClick={() => setStep("self")}>Continue <Icon name="chev" size={16} /></button></div>
        </section>
      )}

      {step === "self" && (
        <section className="glass grid gap-5 p-5">
          <SectionTitle eyebrow="Step 4" title="Quick self-check" />
          <p className="text-sm text-ink-2">Hairline, grooming and hydration cannot be read reliably from a photo, so you rate them. Be honest. The scores only help if they are consistent.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Choice id="c1" label="Fullness under the chin" hint="pinch test" value={self.submentalFullness} onChange={(v) => setSelf({ ...self, submentalFullness: v as SelfAssessment["submentalFullness"] })} options={[{ v: 1, l: "Lean" }, { v: 2, l: "Slight" }, { v: 3, l: "Some" }, { v: 4, l: "Noticeable" }, { v: 5, l: "Heavy" }]} />
            <Choice id="c2" label="Acne / breakouts" value={self.acne} onChange={(v) => setSelf({ ...self, acne: v as SelfAssessment["acne"] })} options={[{ v: 0, l: "None" }, { v: 1, l: "Mild" }, { v: 2, l: "Moderate" }, { v: 3, l: "Severe" }]} />
            <Choice id="c3" label="Hairline (Norwood)" value={self.norwood} onChange={(v) => setSelf({ ...self, norwood: v as SelfAssessment["norwood"] })} options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ v: n, l: String(n) }))} hint="1 = no recession" />
            <Choice id="c4" label="Hair condition" value={self.hairCondition} onChange={(v) => setSelf({ ...self, hairCondition: v as SelfAssessment["hairCondition"] })} options={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: ["Poor", "Dry/thin", "Okay", "Good", "Great"][n - 1] }))} />
            <Choice id="c5" label="Brows" value={self.brows} onChange={(v) => setSelf({ ...self, brows: v as SelfAssessment["brows"] })} options={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: ["Untidy", "Rough", "Okay", "Neat", "Sharp"][n - 1] }))} />
            <Choice id="c6" label="Facial hair / shave" value={self.facialHair} onChange={(v) => setSelf({ ...self, facialHair: v as SelfAssessment["facialHair"] })} options={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: ["Untidy", "Rough", "Okay", "Neat", "Sharp"][n - 1] }))} />
            <Choice id="c7" label="Teeth" value={self.teeth} onChange={(v) => setSelf({ ...self, teeth: v as SelfAssessment["teeth"] })} options={[1, 2, 3, 4, 5].map((n) => ({ v: n, l: ["Poor", "Stained", "Okay", "Good", "Great"][n - 1] }))} />
            <div className="grid gap-1.5"><div className="text-sm font-bold">Skin feels</div>
              <div className="flex flex-wrap gap-1.5">{([["skinTight", "Tight"], ["skinFlaky", "Flaky"], ["skinOily", "Oily"]] as const).map(([k, l]) => <button key={k} aria-pressed={self[k]} onClick={() => setSelf({ ...self, [k]: !self[k] })} className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${self[k] ? "border-vio-2 bg-vio/30 text-white" : "border-line bg-white/[0.04] text-ink-2"}`}>{l}</button>)}</div></div>
          </div>
          <div className="flex justify-between"><button className="btn" onClick={() => setStep(side ? "measure" : "front")}>Back</button><button className="btn btn-emr" disabled={!front && !side && measures.cvaDeg == null} onClick={run}><Icon name="sparkle" size={18} /> Analyse</button></div>
          {!front && !side && <p className="text-xs text-ink-3">Add at least one photo to run an analysis.</p>}
        </section>
      )}
    </div>
  );
}

// ───────────────────────── result ─────────────────────────

function Result({ scan, onBack, onNew }: { scan: ScanResult; onBack: () => void; onNew: () => void }) {
  const { state, today, setAction } = useApp();
  const { photos, scans, removeScan, removePhoto } = useData();
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const idx = scans.findIndex((s) => s.id === scan.id);
  const prev = idx > 0 ? scans[idx - 1] : null;
  const ctx = { waterRatio7d: waterRatio7d(state.logs, state.settings, today), sleepAvg7d: sleepAvg7d(state.logs, today) };
  const actions = useMemo(() => buildActions(scan, ctx), [scan, ctx.waterRatio7d, ctx.sleepAvg7d]); // eslint-disable-line react-hooks/exhaustive-deps
  const front = photos.find((x) => x.id === scan.frontId), side = photos.find((x) => x.id === scan.sideId);
  const doneCount = actions.filter((a) => state.actionsDone[a.id]).length;
  const f = scan.front;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><button className="btn btn-sm" onClick={onBack}>All scans</button><button className="btn btn-emr btn-sm" onClick={onNew}><Icon name="camera" size={16} /> New scan</button></div>

      <section className="glass relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-vio/25 blur-3xl" />
        <div className="relative grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Ring value={scan.overall / 10} size={128} stroke={12}><div><div className="font-display text-4xl font-extrabold tnum">{scan.overall.toFixed(1)}</div><div className="label -mt-1">overall</div></div></Ring>
          <div>
            <div className="label">Day {scan.day} · {fmtDate(scan.dateKey, { month: "long", day: "numeric", year: "numeric" })}</div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{scan.overall >= 8 ? "Strong across the board" : scan.overall >= 6.5 ? "Solid base with clear levers" : "Lots of upside available"}</h1>
            <p className="mt-1 text-sm text-ink-2">{prev ? `${scan.overall - prev.overall >= 0 ? "Up" : "Down"} ${Math.abs(scan.overall - prev.overall).toFixed(1)} from your day ${prev.day} scan.` : "This is your baseline. Compare future scans taken the same way."}{scan.faceShape ? ` Face shape reads as ${scan.faceShape.toLowerCase()}.` : ""}</p>
          </div>
          <div className="flex gap-2">{front && /* eslint-disable-next-line @next/next/no-img-element */ <img src={front.dataUrl} alt="Front" className="h-24 w-[4.5rem] rounded-xl border border-line object-cover" />}{side && /* eslint-disable-next-line @next/next/no-img-element */ <img src={side.dataUrl} alt="Side" className="h-24 w-[4.5rem] rounded-xl border border-line object-cover" />}</div>
        </div>
        {f && (!f.quality.yawOk || !f.quality.rollOk || !f.quality.bright) && (
          <p className="relative mt-4 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-[#fde68a]">Photo quality lowered confidence: {[!f.quality.yawOk && `head turned ${Math.abs(f.yawDeg).toFixed(0)}°`, !f.quality.rollOk && `tilted ${Math.abs(f.rollDeg).toFixed(0)}°`, !f.quality.bright && "lighting"].filter(Boolean).join(", ")}. Retake for more reliable numbers.</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {scan.categories.map((c) => {
          const pv = prev?.categories.find((x) => x.key === c.key);
          const d = pv ? c.score - pv.score : null;
          const isOpen = open === c.key;
          return (
            <article key={c.key} className="glass grid content-start gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="label">{c.label}</div><h3 className="text-lg font-bold leading-snug">{c.headline}</h3></div>
                <div className="text-right"><div className="font-display text-3xl font-extrabold tnum">{c.score.toFixed(1)}</div>{d != null && Math.abs(d) >= 0.1 && <div className={`text-xs font-bold tnum ${d >= 0 ? "text-emr-2" : "text-bad"}`}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}</div>}</div>
              </div>
              <Bar value={c.score / 10} tone={c.score >= 7 ? "emr" : "vio"} />
              <div><span className={`chip ${c.confidence === "high" ? "chip-emr" : c.confidence === "medium" ? "chip-vio" : "chip-warn"}`}>{c.confidence} confidence</span></div>
              <ul className="grid gap-2 text-sm text-ink-2">{c.details.map((t, i) => <li key={i} className="flex gap-2"><Icon name="chev" size={14} className="mt-1 shrink-0 text-vio-3" />{t}</li>)}</ul>
              <button className="w-fit text-xs font-bold text-vio-3 underline-offset-2 hover:underline" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : c.key)}>{isOpen ? "Hide" : "How this score is built"}</button>
              {isOpen && <ul className="grid gap-1 rounded-xl bg-black/25 p-3 text-xs text-ink-3">{c.basis.map((t, i) => <li key={i}>{t}</li>)}</ul>}
            </article>
          );
        })}
      </section>

      <section className="glass p-5">
        <SectionTitle eyebrow="Glow-up action list" title="What to do next" action={<span className="chip chip-emr tnum">{doneCount}/{actions.length} done</span>} />
        <div className="mt-3"><Bar value={actions.length ? doneCount / actions.length : 0} /></div>
        <ul className="mt-4 grid gap-3">
          {actions.map((a) => {
            const done = !!state.actionsDone[a.id];
            return (
              <li key={a.id} className={`rounded-2xl border p-4 ${done ? "border-emr-2/30 bg-emr/[0.06]" : "border-line bg-white/[0.03]"}`}>
                <div className="flex items-start gap-3">
                  <button role="checkbox" aria-checked={done} aria-label={`Mark ${a.title} ${done ? "not done" : "done"}`} onClick={() => setAction(a.id, !done)} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${done ? "border-emr-2 bg-emr text-[#04140d]" : "border-line bg-white/5 text-transparent hover:text-ink-3"}`}><Icon name="check" size={16} stroke={3} /></button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h4 className={`font-bold ${done ? "text-ink-3 line-through" : ""}`}>{a.title}</h4>{a.priority === 1 && !done && <span className="chip chip-vio">High impact</span>}</div>
                    <p className="mt-1 text-sm text-ink-2">{a.why}</p>
                    <ul className="mt-2 grid gap-1 text-sm text-ink-2">{a.how.map((h, i) => <li key={i} className="flex gap-2"><span className="text-emr-2">•</span>{h}</li>)}</ul>
                    {a.studyIds.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{a.studyIds.map((id) => STUDIES[id] && <span key={id} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-black/20 px-2 py-1 text-[11px] text-ink-3" title={STUDIES[id].finding}><GradeChip grade={STUDIES[id].grade} />{STUDIES[id].cite.split(/[.,]/)[0]}</span>)}</div>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex justify-end">{!del ? <button className="btn btn-sm text-bad" onClick={() => setDel(true)}><Icon name="trash" size={16} /> Delete this scan</button> : <div className="flex items-center gap-2 text-sm"><span>Delete scan and its photos?</span><button className="btn btn-sm" onClick={() => setDel(false)}>Keep</button><button className="btn btn-sm text-bad" onClick={async () => { if (scan.frontId) await removePhoto(scan.frontId); if (scan.sideId) await removePhoto(scan.sideId); await removeScan(scan.id); onBack(); }}>Delete</button></div>}</div>
    </div>
  );
}
