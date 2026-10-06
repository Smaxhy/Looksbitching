"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { useData } from "./data";
import { Bar, GradeChip, Icon, Ring, SectionTitle } from "./ui";
import { FaceMap, BodyMap } from "./Overlays";
import { buildActions } from "@/lib/analysis";
import { GROUP_LABEL } from "@/lib/features";
import { sleepAvg7d, waterRatio7d } from "@/lib/habits";
import { STUDIES } from "@/lib/evidence";
import { fmtDate } from "@/lib/dates";
import { getKey, reviewWithClaude, setKey } from "@/lib/ai";
import type { Feature, FeatureGroup, PhotoRecord, ScanResult } from "@/lib/types";

type View = "summary" | "face" | "features" | "body" | "ai";

const tone = (s: number) => (s >= 7.5 ? "emr" : "vio") as "emr" | "vio";

function Radar({ items }: { items: { label: string; score: number }[] }) {
  const n = items.length, C = 130, R = 88;
  const pt = (i: number, v: number): [number, number] => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [C + Math.cos(a) * R * (v / 10), C + Math.sin(a) * R * (v / 10)]; };
  const poly = items.map((it, i) => pt(i, it.score).join(",")).join(" ");
  return (
    <svg viewBox="0 0 260 260" className="mx-auto w-full max-w-xs" role="img" aria-label="Score by category">
      {[2.5, 5, 7.5, 10].map((v) => <polygon key={v} points={items.map((_, i) => pt(i, v).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.1)" />)}
      {items.map((_, i) => { const [x, y] = pt(i, 10); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,.08)" />; })}
      <polygon points={poly} fill="rgba(139,92,246,.35)" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" />
      {items.map((it, i) => { const [x, y] = pt(i, it.score); return <circle key={i} cx={x} cy={y} r="3.5" fill="#6ee7b7" stroke="#07060d" strokeWidth="1.5" />; })}
      {items.map((it, i) => {
        const [x, y] = pt(i, 12.6);
        return <text key={i} x={x} y={y} textAnchor={x < C - 6 ? "end" : x > C + 6 ? "start" : "middle"} dominantBaseline="middle" fontSize="9.5" fontWeight="700" fill="#b9b4d1">{it.label}</text>;
      })}
    </svg>
  );
}

function FeatureRow({ f }: { f: Feature }) {
  return (
    <li className="glass-flat grid gap-1.5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="text-sm font-bold">{f.label}</div><div className="text-xs text-ink-3">Ref: {f.ref}</div></div>
        <div className="shrink-0 text-right"><div className="font-display text-lg font-extrabold tnum">{f.value}</div>{f.score != null ? <div className="text-xs font-bold text-ink-2 tnum">{f.score.toFixed(1)}/10</div> : <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Descriptive</div>}</div>
      </div>
      {f.score != null && <Bar value={f.score / 10} tone={tone(f.score)} h={6} />}
      <p className="text-xs text-ink-2">{f.note}</p>
      <div className="flex gap-1.5"><span className={`chip ${f.confidence === "medium" || f.confidence === "high" ? "chip-vio" : "chip-warn"}`}>{f.confidence} confidence</span><span className="chip">{f.source === "manual" ? "you measured" : f.source === "measured" ? "your numbers" : f.source === "self" ? "self-rated" : "from photo"}</span></div>
    </li>
  );
}

export function Report({ scan, onBack, onNew }: { scan: ScanResult; onBack: () => void; onNew: () => void }) {
  const { state, today, setAction } = useApp();
  const { photos, scans, removeScan, removePhoto, addScan } = useData();
  const [view, setView] = useState<View>("summary");
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const idx = scans.findIndex((s) => s.id === scan.id);
  const prev = idx > 0 ? scans[idx - 1] : null;
  const ctx = { waterRatio7d: waterRatio7d(state.logs, state.settings, today), sleepAvg7d: sleepAvg7d(state.logs, today) };
  const actions = useMemo(() => buildActions(scan, ctx), [scan, ctx.waterRatio7d, ctx.sleepAvg7d]); // eslint-disable-line react-hooks/exhaustive-deps
  const ph = (id?: string) => photos.find((x) => x.id === id);
  const front = ph(scan.frontId), side = ph(scan.sideId), bodyF = ph(scan.bodyFrontId), bodyS = ph(scan.bodySideId);
  const doneCount = actions.filter((a) => state.actionsDone[a.id]).length;
  const f = scan.front;
  const feats = scan.features ?? [];
  const scored = feats.filter((x) => x.score != null);
  const conf = (c: Feature["confidence"]) => (c === "high" ? 2 : c === "medium" ? 1 : 0);
  const strengths = [...scored].filter((x) => (x.score as number) >= 7.5).sort((a, b) => (b.score as number) + conf(b.confidence) * 0.3 - ((a.score as number) + conf(a.confidence) * 0.3)).slice(0, 4);
  const levers = [...scored].filter((x) => (x.score as number) < 7).sort((a, b) => (a.score as number) - conf(a.confidence) * 0.3 - ((b.score as number) - conf(b.confidence) * 0.3)).slice(0, 4);
  const groups = useMemo(() => {
    const m = new Map<FeatureGroup, Feature[]>();
    for (const x of feats) m.set(x.group, [...(m.get(x.group) ?? []), x]);
    return [...m.entries()];
  }, [feats]);

  const tabs: { id: View; label: string }[] = [{ id: "summary", label: "Summary" }, { id: "face", label: "Face map" }, { id: "features", label: `All features (${feats.length})` }, { id: "body", label: "Body" }, { id: "ai", label: "AI review" }];

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
            <p className="mt-1 text-sm text-ink-2">{prev ? `${scan.overall - prev.overall >= 0 ? "Up" : "Down"} ${Math.abs(scan.overall - prev.overall).toFixed(1)} from your day ${prev.day} scan.` : "This is your baseline. Compare future scans taken the same way."}{scan.faceShape ? ` Face shape reads as ${scan.faceShape.toLowerCase()}.` : ""} {feats.length} measurements across {scan.categories.length} areas.</p>
          </div>
          <div className="flex gap-2">{[front, side, bodyF, bodyS].filter(Boolean).map((p) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={(p as PhotoRecord).id} src={(p as PhotoRecord).dataUrl} alt={(p as PhotoRecord).kind} className="h-24 w-[4.5rem] rounded-xl border border-line object-cover" />)}</div>
        </div>
        {f && (!f.quality.yawOk || !f.quality.rollOk || !f.quality.bright) && (
          <p className="relative mt-4 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-[#fde68a]">Photo quality lowered confidence: {[!f.quality.yawOk && `head turned ${Math.abs(f.yawDeg).toFixed(0)}°`, !f.quality.rollOk && `tilted ${Math.abs(f.rollDeg).toFixed(0)}°`, !f.quality.bright && "lighting"].filter(Boolean).join(", ")}. Retake for more reliable numbers.</p>
        )}
      </section>

      <div className="scroll-x flex gap-1 rounded-2xl border border-line bg-white/[0.04] p-1" role="tablist">
        {tabs.map((t) => <button key={t.id} role="tab" aria-selected={view === t.id} onClick={() => setView(t.id)} className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${view === t.id ? "bg-gradient-to-r from-vio/60 to-vio/30 text-white" : "text-ink-3 hover:text-ink"}`}>{t.label}</button>)}
      </div>

      {view === "summary" && (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <div className="glass p-4"><div className="label mb-2 text-center">Score map</div><Radar items={scan.categories.map((c) => ({ label: c.label.replace(" (outline-based)", "").replace("Skin, hydration & eyes", "Skin").replace("Jawline & submental", "Jaw & neck").replace("Hairline & grooming", "Grooming").replace("Symmetry & posture", "Symmetry"), score: c.score }))} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass p-4"><div className="label mb-2 text-emr-2">Strongest</div><ul className="grid gap-2 text-sm">{strengths.length ? strengths.map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.label}</span><b className="tnum text-emr-3">{x.score?.toFixed(1)}</b></li>) : <li className="text-ink-3">Nothing scored 7.5 or higher yet.</li>}</ul></div>
              <div className="glass p-4"><div className="label mb-2 text-vio-3">Biggest levers</div><ul className="grid gap-2 text-sm">{levers.length ? levers.map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.label}</span><b className="tnum text-vio-3">{x.score?.toFixed(1)}</b></li>) : <li className="text-ink-3">Everything measured is in the typical range.</li>}</ul></div>
            </div>
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
                  <Bar value={c.score / 10} tone={tone(c.score)} />
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
        </>
      )}

      {view === "face" && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
          {front && f ? <div className="self-start lg:sticky lg:top-4"><FaceMap src={front.dataUrl} f={f} /></div> : <div className="glass self-start p-6 text-sm text-ink-2">No front photo with a detected face in this scan. Run a new scan with a front photo to get the measurement map.</div>}
          <ul className="grid content-start gap-2">{feats.filter((x) => ["proportion", "eyes", "nose", "mouth", "jaw", "midface"].includes(x.group)).map((x) => <FeatureRow key={x.id} f={x} />)}</ul>
        </section>
      )}

      {view === "features" && (
        <section className="grid gap-6">
          <p className="rounded-xl border border-line bg-white/[0.03] p-3 text-xs text-ink-2">Each measurement shows the reference it was compared against. Descriptive traits have no better or worse direction. A photo shows the outline of soft tissue, so anything about bone structure here is an inference from that outline and not a view of the bone.</p>
          {groups.map(([g, list]) => (
            <div key={g} className="grid gap-2"><h3 className="text-lg font-bold">{GROUP_LABEL[g]}</h3><ul className="grid gap-2 md:grid-cols-2">{list.map((x) => <FeatureRow key={x.id} f={x} />)}</ul></div>
          ))}
          {!feats.length && <p className="text-sm text-ink-3">No detailed measurements in this scan.</p>}
        </section>
      )}

      {view === "body" && (
        <section className="grid gap-4">
          {!scan.bodyInputs && !scan.poseFront && !scan.poseSide ? (
            <div className="glass p-6 text-sm text-ink-2">No body data in this scan. Start a new scan and use the Body step to add your measurements (height, weight, waist, hips, neck, shoulders) and optional full-body photos. You will get waist-to-height, body-fat estimate, V-taper, and a posture check.</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {bodyF && scan.poseFront ? <div><div className="label mb-2">Front</div><BodyMap src={bodyF.dataUrl} kind="front" front={scan.poseFront} /></div> : null}
                {bodyS && scan.poseSide ? <div><div className="label mb-2">Side</div><BodyMap src={bodyS.dataUrl} kind="side" side={scan.poseSide} /></div> : null}
              </div>
              <ul className="grid gap-2 md:grid-cols-2">{feats.filter((x) => x.group === "body" || x.group === "posture").map((x) => <FeatureRow key={x.id} f={x} />)}</ul>
            </>
          )}
        </section>
      )}

      {view === "ai" && <AiPanel scan={scan} photos={photos} onSaved={(r) => addScan(r)} />}

      <div className="flex justify-end">{!del ? <button className="btn btn-sm text-bad" onClick={() => setDel(true)}><Icon name="trash" size={16} /> Delete this scan</button> : <div className="flex items-center gap-2 text-sm"><span>Delete scan and its photos?</span><button className="btn btn-sm" onClick={() => setDel(false)}>Keep</button><button className="btn btn-sm text-bad" onClick={async () => { for (const id of [scan.frontId, scan.sideId, scan.bodyFrontId, scan.bodySideId]) if (id) await removePhoto(id); await removeScan(scan.id); onBack(); }}>Delete</button></div>}</div>
    </div>
  );
}

function AiPanel({ scan, photos, onSaved }: { scan: ScanResult; photos: PhotoRecord[]; onSaved: (s: ScanResult) => void }) {
  const [key, setK] = useState(getKey());
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const avail: { label: string; p: PhotoRecord }[] = [];
  for (const [label, id] of [["Front face", scan.frontId], ["Side profile", scan.sideId], ["Body front", scan.bodyFrontId], ["Body side", scan.bodySideId]] as [string, string | undefined][]) {
    const p = photos.find((x) => x.id === id);
    if (p) avail.push({ label, p });
  }
  const [use, setUse] = useState<Record<string, boolean>>(Object.fromEntries(avail.map((a) => [a.label, a.label === "Front face" || a.label === "Side profile"])));
  const r = scan.aiReview;

  const run = async () => {
    setErr(""); setBusy(true);
    try {
      setKey(key.trim());
      const images = avail.filter((a) => use[a.label]).map((a) => ({ label: a.label, dataUrl: a.p.dataUrl }));
      if (!images.length) throw new Error("Pick at least one photo.");
      const review = await reviewWithClaude({ apiKey: key.trim(), images, result: scan });
      onSaved({ ...scan, aiReview: review });
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    setBusy(false);
  };

  return (
    <section className="grid gap-4">
      <div className="glass grid gap-4 p-5">
        <SectionTitle eyebrow="Optional · uses your own Claude API key" title="AI deep review" />
        <p className="text-sm text-ink-2">The on-device scan measures geometry. This adds a written review from Claude that looks at the photos themselves: feature ratings, haircut, facial hair, glasses and skincare suggestions, and body notes. It is an opinion, not a measurement.</p>
        <div className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-[#fde68a]"><b>Privacy:</b> unlike the rest of the app, this sends the photos you tick below, plus your measurements, to Anthropic. Your key is stored only in this browser and goes only to Anthropic.</div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div><label htmlFor="ai-key" className="label mb-1.5 block">Anthropic API key</label><input id="ai-key" type="password" autoComplete="off" placeholder="sk-ant-..." value={key} onChange={(e) => setK(e.target.value)} /></div>
          {key && <button className="btn btn-sm" onClick={() => { setKey(""); setK(""); }}>Forget key</button>}
        </div>
        <fieldset className="grid gap-2"><legend className="label mb-1">Photos to send</legend>
          <div className="flex flex-wrap gap-2">{avail.map((a) => <label key={a.label} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white/[0.04] px-3 py-1.5 text-xs font-bold"><input type="checkbox" checked={!!use[a.label]} onChange={(e) => setUse({ ...use, [a.label]: e.target.checked })} />{a.label}</label>)}{!avail.length && <span className="text-xs text-ink-3">This scan has no stored photos.</span>}</div></fieldset>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-2"><input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I am 18 or older, these are photos of me, and I agree to send the selected photos to Anthropic to generate this review.</span></label>
        <div className="flex flex-wrap items-center gap-3"><button className="btn btn-vio" disabled={busy || !consent || !key.trim() || !avail.length} onClick={run}><Icon name="sparkle" size={18} /> {busy ? "Reviewing…" : r ? "Run again" : "Generate review"}</button>{busy && <span className="text-xs text-ink-3">This can take up to a minute.</span>}</div>
        {err && <p className="text-sm text-bad" role="alert">{err}</p>}
      </div>

      {r && (
        <div className="grid gap-4">
          <div className="glass p-5"><div className="label mb-1">Overall impression</div><p className="text-sm leading-relaxed">{r.summary}</p><p className="mt-2 text-[11px] text-ink-3">{r.model} · {new Date(r.ts).toLocaleString()}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass p-5"><div className="label mb-2 text-emr-2">Strengths</div><ul className="grid gap-2 text-sm text-ink-2">{r.strengths.map((s, i) => <li key={i} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-emr-2" />{s}</li>)}</ul></div>
            <div className="glass p-5"><div className="label mb-2 text-vio-3">Biggest improvements</div><ul className="grid gap-2 text-sm text-ink-2">{r.improvements.map((s, i) => <li key={i} className="flex gap-2"><Icon name="chev" size={16} className="mt-0.5 shrink-0 text-vio-3" />{s}</li>)}</ul></div>
          </div>
          <div className="glass p-5"><div className="label mb-3">Feature ratings</div><ul className="grid gap-3 md:grid-cols-2">{r.features.map((x, i) => <li key={i} className="grid gap-1"><div className="flex items-center justify-between gap-2 text-sm font-bold"><span>{x.name}</span><span className="tnum">{x.rating.toFixed(1)}</span></div><Bar value={x.rating / 10} tone={tone(x.rating)} h={6} /><p className="text-xs text-ink-2">{x.comment}</p></li>)}</ul></div>
          <div className="glass p-5"><div className="label mb-3">Styling and grooming</div><dl className="grid gap-3 text-sm md:grid-cols-2">{([["Hairstyle", r.grooming.hairstyle], ["Facial hair", r.grooming.facialHair], ["Glasses", r.grooming.eyewear], ["Skincare", r.grooming.skincare], ["Style", r.grooming.style]] as const).map(([k, v]) => <div key={k}><dt className="font-bold">{k}</dt><dd className="text-ink-2">{v}</dd></div>)}</dl></div>
          {r.body && <div className="glass p-5"><div className="label mb-1">Body and posture</div><p className="text-sm text-ink-2">{r.body}</p></div>}
          <p className="rounded-xl border border-line bg-white/[0.03] p-3 text-xs text-ink-3">{r.caveats}</p>
        </div>
      )}
    </section>
  );
}
