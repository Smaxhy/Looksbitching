"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { useData } from "./data";
import { Capture } from "./Capture";
import { Measure } from "./Measure";
import { Report } from "./Report";
import { Icon, Ring, SectionTitle } from "./ui";
import { analyzeFront, buildResult, DEFAULT_SELF, NoFaceError } from "@/lib/analysis";
import { analyzePoseFront, analyzePoseSide, NoBodyError } from "@/lib/pose";
import { sleepAvg7d, waterRatio7d } from "@/lib/habits";
import { uid } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import type { BodyInputs, FrontMetrics, Measures, PoseFront, PoseSide, ScanResult, SelfAssessment, Sex } from "@/lib/types";

type Step = "home" | "gate" | "front" | "side" | "measure" | "body" | "self" | "busy" | "result";

export function Scan() {
  const { state } = useApp();
  const { scans } = useData();
  const [step, setStep] = useState<Step>("home");
  const [front, setFront] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [bodyF, setBodyF] = useState<string | null>(null);
  const [bodyS, setBodyS] = useState<string | null>(null);
  const [measures, setMeasures] = useState<Measures>({});
  const [bodyInputs, setBodyInputs] = useState<BodyInputs>({});
  const [self, setSelf] = useState<SelfAssessment>(DEFAULT_SELF);
  const [viewId, setViewId] = useState<string | null>(null);

  const view = scans.find((s) => s.id === viewId) ?? scans[scans.length - 1];
  const begin = () => {
    setFront(null); setSide(null); setBodyF(null); setBodyS(null); setMeasures({}); setBodyInputs({}); setSelf(DEFAULT_SELF);
    setStep(state.settings.adultConfirmed ? "front" : "gate");
  };

  if (step === "home") return <Home onNew={begin} onOpen={(id) => { setViewId(id); setStep("result"); }} />;
  if (step === "result" && view) return <Report scan={view} onBack={() => setStep("home")} onNew={begin} />;
  if (step === "gate") return <Gate onCancel={() => setStep("home")} onOk={() => setStep("front")} />;
  return (
    <Wizard
      step={step} setStep={setStep} front={front} side={side} setFront={setFront} setSide={setSide} bodyF={bodyF} bodyS={bodyS} setBodyF={setBodyF} setBodyS={setBodyS}
      measures={measures} setMeasures={setMeasures} bodyInputs={bodyInputs} setBodyInputs={setBodyInputs} self={self} setSelf={setSelf}
      onDone={(id) => { setViewId(id); setStep("result"); }}
    />
  );
}

function Gate({ onCancel, onOk }: { onCancel: () => void; onOk: () => void }) {
  const { state, setSettings } = useApp();
  const [adult, setAdult] = useState(false);
  const [sex, setSex] = useState<Sex>(state.settings.sex ?? "unspecified");
  return (
    <div className="glass mx-auto grid max-w-xl gap-5 p-6">
      <SectionTitle eyebrow="Before you start" title="About these ratings" />
      <ul className="grid gap-2 text-sm text-ink-2">
        <li className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-emr-2" />Everything is computed on your device from your own photos.</li>
        <li className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-emr-2" />Scores compare your measurements with typical ranges from published research and clinical references. They describe proportions and habits you can change, not your worth.</li>
        <li className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-emr-2" />A photo shows soft-tissue outline, not bone. Bone-structure notes are inferences from that outline.</li>
        <li className="flex gap-2"><Icon name="x" size={16} className="mt-0.5 shrink-0 text-bad" />If checking your appearance often leaves you feeling worse, take a break from this tab and consider talking to someone you trust or a professional.</li>
      </ul>
      <div><div className="label mb-2">Reference ranges to compare against</div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reference set">{([["male", "Male-typical"], ["female", "Female-typical"], ["unspecified", "Neutral"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={sex === v} onClick={() => setSex(v)} className={`rounded-lg border px-4 py-2 text-sm font-bold ${sex === v ? "border-vio-2 bg-vio/30 text-white" : "border-line bg-white/[0.04] text-ink-2"}`}>{l}</button>)}</div>
        <p className="mt-2 text-xs text-ink-3">Used only to pick reference bands for jaw, nose angle and body measures. Pick whichever fits your goal.</p></div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-black/20 p-3 text-sm text-ink-2"><input type="checkbox" className="mt-1 h-4 w-4" checked={adult} onChange={(e) => setAdult(e.target.checked)} /><span>I am 18 or older and I am rating photos of myself.</span></label>
      <div className="flex justify-between"><button className="btn" onClick={onCancel}>Back</button><button className="btn btn-emr" disabled={!adult} onClick={() => { setSettings({ adultConfirmed: true, sex }); onOk(); }}>Continue <Icon name="chev" size={16} /></button></div>
    </div>
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

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("img")); i.src = src; });

function PhotoStep({ kind, value, onChange, title, eyebrow, back, next, nextLabel, skip }: { kind: "front" | "side" | "bodyFront" | "bodySide"; value: string | null; onChange: (s: string | null) => void; title: string; eyebrow: string; back?: () => void; next: () => void; nextLabel: string; skip?: { label: string; go: () => void } }) {
  return (
    <section className="glass grid gap-4 p-5">
      <SectionTitle eyebrow={eyebrow} title={title} />
      {value ? (
        <div className="grid gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={title} className="mx-auto max-h-[28rem] rounded-2xl border border-line" />
          <div className="flex justify-center gap-2"><button className="btn" onClick={() => onChange(null)}>Retake</button><button className="btn btn-vio" onClick={next}>{nextLabel} <Icon name="chev" size={16} /></button></div>
        </div>
      ) : <Capture kind={kind} onCapture={(d) => onChange(d)} />}
      <div className="flex justify-center gap-2">{back && <button className="btn btn-ghost btn-sm" onClick={back}>Back</button>}{!value && skip && <button className="btn btn-ghost btn-sm" onClick={skip.go}>{skip.label}</button>}</div>
    </section>
  );
}

const IN = 2.54, LB = 0.45359237;
function Num({ id, label, metric, imperial, value, onChange, hint, imp }: { id: string; label: string; metric: string; imperial: string; value?: number; onChange: (v?: number) => void; hint?: string; imp: boolean }) {
  const factor = imperial === "lb" ? 1 / LB : imperial === "in" ? 1 / IN : 1;
  const shown = value == null ? "" : String(Math.round((imp ? value * factor : value) * 10) / 10);
  return (
    <div className="grid gap-1"><label htmlFor={id} className="text-sm font-bold">{label}{hint && <span className="ml-2 text-xs font-medium text-ink-3">{hint}</span>}</label>
      <div className="flex items-center gap-2"><input id={id} type="number" inputMode="decimal" step="0.1" min="0" value={shown} onChange={(e) => { const n = e.target.value === "" ? undefined : Number(e.target.value); onChange(n == null || Number.isNaN(n) ? undefined : imp ? n / factor : n); }} /><span className="w-8 text-xs text-ink-3">{imp ? imperial : metric}</span></div></div>
  );
}

function BodyStep({ b, setB, bodyF, bodyS, setBodyF, setBodyS, back, next }: { b: BodyInputs; setB: (x: BodyInputs) => void; bodyF: string | null; bodyS: string | null; setBodyF: (s: string | null) => void; setBodyS: (s: string | null) => void; back: () => void; next: () => void }) {
  const [imp, setImp] = useState(false);
  const [cap, setCap] = useState<"" | "bodyFront" | "bodySide">("");
  const set = (k: keyof BodyInputs) => (v?: number) => setB({ ...b, [k]: v });
  return (
    <section className="glass grid gap-5 p-5">
      <SectionTitle eyebrow="Step 4 · optional" title="Body measurements and photos" />
      <p className="text-sm text-ink-2">Add what you know. Each number unlocks another measurement: body mass index, waist-to-height, waist-to-hip, an estimated body-fat percentage, and V-taper. Full-body photos add a posture check from joint positions.</p>
      <div className="flex gap-1 rounded-xl border border-line bg-white/[0.04] p-1 w-fit">{[["Metric (cm, kg)", false], ["Imperial (in, lb)", true]].map(([l, v]) => <button key={String(l)} onClick={() => setImp(v as boolean)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${imp === v ? "bg-vio/50 text-white" : "text-ink-3"}`}>{l as string}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Num id="b-h" label="Height" metric="cm" imperial="in" imp={imp} value={b.heightCm} onChange={set("heightCm")} />
        <Num id="b-w" label="Weight" metric="kg" imperial="lb" imp={imp} value={b.weightKg} onChange={set("weightKg")} />
        <Num id="b-waist" label="Waist" hint="at the navel, relaxed" metric="cm" imperial="in" imp={imp} value={b.waistCm} onChange={set("waistCm")} />
        <Num id="b-hip" label="Hips" hint="widest point" metric="cm" imperial="in" imp={imp} value={b.hipCm} onChange={set("hipCm")} />
        <Num id="b-neck" label="Neck" hint="below the Adam's apple" metric="cm" imperial="in" imp={imp} value={b.neckCm} onChange={set("neckCm")} />
        <Num id="b-sh" label="Shoulders" hint="around the widest point of the shoulders" metric="cm" imperial="in" imp={imp} value={b.shoulderCm} onChange={set("shoulderCm")} />
      </div>
      <div className="grid gap-3">
        <div className="label">Full-body photos (posture analysis)</div>
        {cap ? (
          <div className="grid gap-3">
            <Capture kind={cap} onCapture={(d) => { (cap === "bodyFront" ? setBodyF : setBodyS)(d); setCap(""); }} />
            <button className="btn btn-sm w-fit" onClick={() => setCap("")}>Cancel</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {([["bodyFront", "Front", bodyF, setBodyF], ["bodySide", "Side", bodyS, setBodyS]] as const).map(([k, l, v, setV]) => (
              <div key={k} className="grid gap-2">
                <div className="relative overflow-hidden rounded-xl border border-line bg-black/40" style={{ aspectRatio: "2 / 3" }}>
                  {v ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v} alt={l} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-3 text-center text-xs text-ink-3">{l} full-body photo</div>}
                </div>
                <div className="flex gap-2"><button className="btn btn-sm flex-1" onClick={() => setCap(k)}>{v ? "Retake" : "Add"}</button>{v && <button className="btn btn-sm btn-ghost" onClick={() => setV(null)}>Remove</button>}</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-ink-3">Wear fitted clothing, stand relaxed 2–3 m from the camera at hip height, whole body in frame, feet visible.</p>
      </div>
      <div className="flex justify-between"><button className="btn" onClick={back}>Back</button><button className="btn btn-vio" onClick={next}>Continue <Icon name="chev" size={16} /></button></div>
    </section>
  );
}

function Wizard(p: {
  step: Step; setStep: (s: Step) => void; front: string | null; side: string | null; setFront: (s: string | null) => void; setSide: (s: string | null) => void;
  bodyF: string | null; bodyS: string | null; setBodyF: (s: string | null) => void; setBodyS: (s: string | null) => void;
  measures: Measures; setMeasures: (m: Measures) => void; bodyInputs: BodyInputs; setBodyInputs: (b: BodyInputs) => void; self: SelfAssessment; setSelf: (s: SelfAssessment) => void; onDone: (id: string) => void;
}) {
  const { state, day, today, toast } = useApp();
  const { addPhoto, addScan } = useData();
  const { step, setStep, front, side, bodyF, bodyS, self, setSelf, measures, bodyInputs } = p;

  const stepsList: Step[] = ["front", "side", "measure", "body", "self"];
  const idx = stepsList.indexOf(step);
  const hasBody = Object.values(bodyInputs).some((v) => v != null);

  const run = async () => {
    setStep("busy");
    let fm: FrontMetrics | undefined;
    let pf: PoseFront | undefined, ps: PoseSide | undefined;
    const msgs: string[] = [];
    if (front) {
      try { fm = await analyzeFront(await loadImg(front)); }
      catch (e) { msgs.push(e instanceof NoFaceError ? "No face was detected in the front photo, so face measurements were skipped." : "The face model could not load, so face measurements were skipped."); }
    }
    if (bodyF) { try { pf = await analyzePoseFront(await loadImg(bodyF)); } catch (e) { msgs.push(e instanceof NoBodyError ? "No body found in the front body photo." : "The pose model could not load."); } }
    if (bodyS) { try { ps = await analyzePoseSide(await loadImg(bodyS)); } catch (e) { msgs.push(e instanceof NoBodyError ? "No body found in the side body photo." : "The pose model could not load."); } }
    const mk = () => uid();
    const ids = { front: front ? mk() : undefined, side: side ? mk() : undefined, bodyFront: bodyF ? mk() : undefined, bodySide: bodyS ? mk() : undefined };
    const d = Math.min(60, Math.max(1, day));
    const ctx = { waterRatio7d: waterRatio7d(state.logs, state.settings, today), sleepAvg7d: sleepAvg7d(state.logs, today) };
    const res = buildResult({
      id: uid(), dateKey: today, day: d, frontId: ids.front, sideId: ids.side, bodyFrontId: ids.bodyFront, bodySideId: ids.bodySide,
      front: fm, measures, self, ctx, sex: state.settings.sex ?? "unspecified", bodyInputs: hasBody ? bodyInputs : undefined, poseFront: pf, poseSide: ps,
    });
    const ts = Date.now();
    const save = async (id: string | undefined, kind: "front" | "side" | "bodyFront" | "bodySide", dataUrl: string | null) => { if (id && dataUrl) await addPhoto({ id, ts, dateKey: today, day: d, kind, dataUrl }); };
    await save(ids.front, "front", front); await save(ids.side, "side", side); await save(ids.bodyFront, "bodyFront", bodyF); await save(ids.bodySide, "bodySide", bodyS);
    await addScan(res);
    if (msgs.length) toast(msgs[0]);
    p.onDone(res.id);
  };

  if (step === "busy") return <div className="glass grid place-items-center gap-3 p-12 text-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-vio/30 border-t-vio-2" /><b>Analysing on your device…</b><span className="text-sm text-ink-3">The first run loads the face model (4 MB) and, for body photos, the pose model (6 MB).</span></div>;

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <button className="btn btn-sm" onClick={() => setStep("home")}>Cancel</button>
        <div className="flex items-center gap-1.5" aria-label="Progress">{stepsList.map((s, i) => <span key={s} className={`h-1.5 w-8 rounded-full ${i <= idx ? "bg-gradient-to-r from-vio to-emr-2" : "bg-white/10"}`} />)}</div>
        <span className="label tnum">{idx + 1}/{stepsList.length}</span>
      </div>

      {step === "front" && <PhotoStep kind="front" value={front} onChange={p.setFront} eyebrow="Step 1" title="Front photo" next={() => setStep("side")} nextLabel="Use photo" skip={{ label: "Skip front photo", go: () => setStep("side") }} />}
      {step === "side" && <PhotoStep kind="side" value={side} onChange={p.setSide} eyebrow="Step 2" title="Side profile photo" back={() => setStep("front")} next={() => setStep("measure")} nextLabel="Measure angles" skip={{ label: "Skip side photo", go: () => setStep("body") }} />}

      {step === "measure" && side && (
        <section className="glass grid gap-4 p-5">
          <SectionTitle eyebrow="Step 3" title="Measure your profile" />
          <p className="text-sm text-ink-2">You place the points yourself so lighting and hair do not fool the model. Do as many of the five angles as you like. Each one adds measurements to your report.</p>
          <Measure src={side} value={measures} onChange={p.setMeasures} />
          <div className="flex justify-between"><button className="btn" onClick={() => setStep("side")}>Back</button><button className="btn btn-vio" onClick={() => setStep("body")}>Continue <Icon name="chev" size={16} /></button></div>
        </section>
      )}

      {step === "body" && <BodyStep b={p.bodyInputs} setB={p.setBodyInputs} bodyF={bodyF} bodyS={bodyS} setBodyF={p.setBodyF} setBodyS={p.setBodyS} back={() => setStep(side ? "measure" : "side")} next={() => setStep("self")} />}

      {step === "self" && (
        <section className="glass grid gap-5 p-5">
          <SectionTitle eyebrow="Step 5" title="Quick self-check" />
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
          <div className="flex justify-between"><button className="btn" onClick={() => setStep("body")}>Back</button><button className="btn btn-emr" disabled={!front && !side && !hasBody && !bodyF && !bodyS} onClick={run}><Icon name="sparkle" size={18} /> Analyse</button></div>
          {!front && !side && !hasBody && !bodyF && !bodyS && <p className="text-xs text-ink-3">Add at least one photo or some body measurements to run an analysis.</p>}
        </section>
      )}
    </div>
  );
}
