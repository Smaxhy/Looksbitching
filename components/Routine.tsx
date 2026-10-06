"use client";
import { useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { useData } from "./data";
import { useShell } from "./Shell";
import { fileToDataUrl } from "./Capture";
import { Bar, Icon, Ring, SectionTitle } from "./ui";
import { AM_STEPS, dayScore, habitItems, PM_STEPS } from "@/lib/habits";
import { addDays, diffDays, fmtDate, fmtTime } from "@/lib/dates";
import { buildICS, buildSchedule, notificationsSupported, requestPermission, showNotification } from "@/lib/notifications";
import { getDayPlan, PROGRAM_DAYS } from "@/lib/program";
import { uid } from "@/lib/db";
import type { PhotoRecord } from "@/lib/types";

export function Routine() {
  return (
    <div className="grid gap-5">
      <header><div className="label">Habits, grooming and self-care</div><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Routine and reminders</h1></header>
      <Checklist />
      <Reminders />
      <ProgressLog />
    </div>
  );
}

function Toggle({ on, onChange, label, id }: { on: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <button id={id} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full border transition ${on ? "border-emr-2/60 bg-emr/70" : "border-line bg-white/10"}`}>
      <span className={`absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow transition-all ${on ? "left-[1.35rem]" : "left-0.5"}`} style={{ height: 22, width: 22 }} />
    </button>
  );
}

function Checklist() {
  const { state, today, day, updateLog } = useApp();
  const { startSession } = useShell();
  const s = state.settings;
  const [key, setKey] = useState(today);
  const k = key > today ? today : key;
  const d = diffDays(s.startDate, k) + 1;
  const log = state.logs[k];
  const items = habitItems(log, s, d);
  const score = dayScore(log, s, d);
  const isToday = k === today;
  const plan = getDayPlan(Math.min(60, Math.max(1, d)));
  const set = (fn: Parameters<typeof updateLog>[1]) => updateLog(k, fn);
  const toggleStep = (kind: "amSteps" | "pmSteps", id: string) => set((l) => ({ ...l, [kind]: l[kind].includes(id) ? l[kind].filter((x) => x !== id) : [...l[kind], id] }));
  const canPrev = diffDays(s.startDate, k) > 0, canNext = k < today;
  void day;

  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="Daily checklist" title={isToday ? "Today" : fmtDate(k, { weekday: "long", month: "short", day: "numeric" })} />
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" disabled={!canPrev} onClick={() => setKey(addDays(k, -1))} aria-label="Previous day"><span className="rotate-180"><Icon name="chev" size={16} /></span></button>
          <span className="chip tnum">{d >= 1 && d <= PROGRAM_DAYS ? `Day ${d}` : "Outside plan"}</span>
          <button className="btn btn-sm" disabled={!canNext} onClick={() => setKey(addDays(k, 1))} aria-label="Next day"><Icon name="chev" size={16} /></button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4 lg:flex-col lg:justify-center">
          <Ring value={score} size={110} stroke={11}><div className="font-display text-3xl font-extrabold tnum">{Math.round(score * 100)}<span className="text-base">%</span></div></Ring>
          <div className="text-xs text-ink-3">{score >= 0.6 ? "Counts toward your streak" : "60% keeps the streak alive"}</div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* water */}
          <div className="glass-flat p-4">
            <div className="flex items-center justify-between"><b className="flex items-center gap-2"><Icon name="drop" size={18} className="text-vio-3" />Water</b><span className="text-xs text-ink-2 tnum">{items[0].detail}</span></div>
            <div className="mt-3"><Bar value={items[0].frac} tone="vio" /></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[250, 500, 750].map((ml) => <button key={ml} className="btn btn-sm" onClick={() => set((l) => ({ ...l, waterMl: l.waterMl + ml }))}>+{ml} ml</button>)}
              <button className="btn btn-sm btn-ghost" onClick={() => set((l) => ({ ...l, waterMl: Math.max(0, l.waterMl - 250) }))}>−250</button>
            </div>
          </div>

          {/* sleep */}
          <div className="glass-flat p-4">
            <div className="flex items-center justify-between"><label htmlFor="sleep-range" className="flex items-center gap-2 font-bold"><Icon name="moon" size={18} className="text-vio-3" />Sleep</label><span className="text-sm font-bold tnum">{log?.sleepHours != null ? `${log.sleepHours.toFixed(1)} h` : "Not logged"}</span></div>
            <input id="sleep-range" type="range" min={3} max={11} step={0.5} className="mt-4" value={log?.sleepHours ?? s.sleepTargetH} onChange={(e) => set((l) => ({ ...l, sleepHours: Number(e.target.value) }))} />
            <div className="mt-1 flex justify-between text-[11px] text-ink-3"><span>3 h</span><span>Target {s.sleepTargetH} h</span><span>11 h</span></div>
          </div>

          {/* skincare */}
          {([["amSteps", "Skincare AM", "sun", AM_STEPS], ["pmSteps", "Skincare PM", "moon", PM_STEPS]] as const).map(([kind, title, ic, steps]) => (
            <div key={kind} className="glass-flat p-4">
              <div className="mb-2 flex items-center justify-between"><b className="flex items-center gap-2"><Icon name={ic} size={18} className={ic === "sun" ? "text-warn" : "text-vio-3"} />{title}</b><span className="text-xs text-ink-2 tnum">{(log?.[kind] ?? []).length}/{steps.length}</span></div>
              <ul className="grid gap-1">
                {steps.map((st) => {
                  const on = (log?.[kind] ?? []).includes(st.id);
                  return (
                    <li key={st.id}><button role="checkbox" aria-checked={on} onClick={() => toggleStep(kind, st.id)} className="flex w-full items-start gap-3 rounded-lg px-1 py-1.5 text-left hover:bg-white/5">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${on ? "border-emr-2 bg-emr text-[#04140d]" : "border-line bg-white/5 text-transparent"}`}><Icon name="check" size={13} stroke={3} /></span>
                      <span><span className={`block text-sm font-semibold ${on ? "text-ink-3 line-through" : ""}`}>{st.label}</span><span className="block text-[11px] text-ink-3">{st.hint}</span></span></button></li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* posture + sessions */}
          <div className="glass-flat p-4">
            <div className="flex items-center justify-between"><b className="flex items-center gap-2"><Icon name="posture" size={18} className="text-emr-2" />Posture check-ins</b><span className="text-xs text-ink-2 tnum">{log?.postureChecks ?? 0}/{plan.postureTarget}</span></div>
            <div className="mt-3"><Bar value={items[3].frac} /></div>
            <div className="mt-3 flex gap-2"><button className="btn btn-emr btn-sm" onClick={() => set((l) => ({ ...l, postureChecks: l.postureChecks + 1 }))}>+ Check-in</button><button className="btn btn-sm btn-ghost" onClick={() => set((l) => ({ ...l, postureChecks: Math.max(0, l.postureChecks - 1) }))}>−</button></div>
            <p className="mt-2 text-[11px] text-ink-3">Tongue to palate, lips sealed, ears over shoulders, shoulders down.</p>
          </div>
          <div className="glass-flat p-4">
            <b className="flex items-center gap-2"><Icon name="zap" size={18} className="text-vio-3" />Exercise sessions</b>
            <div className="mt-3 grid gap-2">
              {([["sessionAM", "Morning", "am"], ["sessionPM", "Evening", "pm"]] as const).map(([f, l, w]) => (
                <div key={f} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{l} {plan.rest ? "recovery" : "session"}</span>
                  <div className="flex items-center gap-2">
                    {isToday && !log?.[f] && <button className="btn btn-vio btn-sm" onClick={() => startSession(w)}><Icon name="play" size={13} /> Start</button>}
                    <button role="checkbox" aria-checked={!!log?.[f]} aria-label={`${l} session done`} onClick={() => set((x) => ({ ...x, [f]: !x[f] }))} className={`grid h-7 w-7 place-items-center rounded-lg border ${log?.[f] ? "border-emr-2 bg-emr text-[#04140d]" : "border-line bg-white/5 text-transparent"}`}><Icon name="check" size={15} stroke={3} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-flat p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="weight" className="flex items-center gap-2 font-bold"><Icon name="scale" size={18} className="text-ink-2" />Body weight <span className="text-xs font-medium text-ink-3">optional. Weekly is enough</span></label>
              <div className="flex items-center gap-2"><input id="weight" type="number" step={0.1} min={30} max={300} inputMode="decimal" className="!w-24 text-center" placeholder="kg" value={log?.weightKg ?? ""} onChange={(e) => set((l) => ({ ...l, weightKg: e.target.value === "" ? null : Number(e.target.value) }))} /><span className="text-xs text-ink-3">kg</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reminders() {
  const { state, setReminders, toast } = useApp();
  const r = state.settings.reminders;
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(typeof window !== "undefined" && notificationsSupported() ? Notification.permission : "unsupported");
  const schedule = useMemo(() => buildSchedule(r), [r]);

  const enable = async (on: boolean) => {
    if (!on) { setReminders({ enabled: false }); return; }
    const p = await requestPermission();
    setPerm(p);
    setReminders({ enabled: true });
    if (p !== "granted") toast("Notifications are blocked, so reminders will show inside the app instead.");
    else toast("Reminders on");
  };

  const ics = () => {
    const blob = new Blob([buildICS(schedule, state.settings.startDate)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "looksbitching-reminders.ics"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const row = (id: string, label: string, sub: string, on: boolean, key: "posture" | "hyoid" | "skin" | "water", extra?: React.ReactNode) => (
    <div className="glass-flat flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="min-w-0"><div className="text-sm font-bold">{label}</div><div className="text-xs text-ink-3">{sub}</div></div>
      <div className="flex items-center gap-3">{extra}<Toggle id={id} on={on} label={label} onChange={(v) => setReminders({ [key]: v })} /></div>
    </div>
  );
  const time = (id: string, v: string, key: "hyoidAM" | "hyoidPM" | "skinAM" | "skinPM" | "wakeStart" | "wakeEnd") => (
    <input id={id} aria-label={id} type="time" value={v} className="!w-36 !min-h-9 !py-1" onChange={(e) => e.target.value && setReminders({ [key]: e.target.value })} />
  );

  return (
    <section className="glass p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle eyebrow="Smart reminders" title="Posture, hyoid, skincare, water" />
        <Toggle id="rem-master" on={r.enabled} onChange={enable} label="Enable reminders" />
      </div>
      {r.enabled && perm !== "granted" && <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-[#fde68a]">{perm === "unsupported" ? "This browser has no notification support, so reminders appear as banners inside the app." : "Notifications are not allowed for this site. Reminders will appear as banners inside the app while it is open. Allow notifications in your browser's site settings for system alerts."}</p>}
      <div className={`mt-4 grid gap-3 ${r.enabled ? "" : "opacity-50"}`}>
        {row("rem-posture", "Posture check", `Press full tongue to palate. Every ${r.postureEveryMin / 60} h between wake and bed.`, r.posture, "posture",
          <div className="flex items-center gap-2">{time("Wake time", r.wakeStart, "wakeStart")}<span className="text-ink-3">to</span>{time("Bed time", r.wakeEnd, "wakeEnd")}</div>)}
        {row("rem-hyoid", "Hyoid exercise time", "Morning and evening sessions", r.hyoid, "hyoid", <div className="flex items-center gap-2">{time("Morning session", r.hyoidAM, "hyoidAM")}{time("Evening session", r.hyoidPM, "hyoidPM")}</div>)}
        {row("rem-skin", "Skincare and hydration", "Morning and night routine", r.skin, "skin", <div className="flex items-center gap-2">{time("Morning skincare", r.skinAM, "skinAM")}{time("Night skincare", r.skinPM, "skinPM")}</div>)}
        {row("rem-water", "Water", `A glass every ${r.waterEveryMin / 60} h`, r.water, "water")}
        <div className="grid gap-1.5 sm:max-w-xs"><label htmlFor="rem-every" className="label">Posture check interval</label>
          <select id="rem-every" value={r.postureEveryMin} onChange={(e) => setReminders({ postureEveryMin: Number(e.target.value) })}>{[60, 90, 120, 180].map((m) => <option key={m} value={m}>Every {m / 60} h</option>)}</select></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-sm" onClick={async () => { const ok = await showNotification("Posture check", "Press your full tongue to the palate. Ears over shoulders.", "test", "dashboard"); toast(ok ? "Test sent" : "Notifications are not allowed yet. Turn reminders on first."); }}><Icon name="bell" size={16} /> Send test</button>
        <button className="btn btn-sm" onClick={ics} disabled={!schedule.length}><Icon name="download" size={16} /> Download calendar reminders</button>
      </div>
      <details className="mt-4 text-xs text-ink-3">
        <summary className="cursor-pointer font-bold text-ink-2">Today's schedule ({schedule.length}) and how delivery works</summary>
        <div className="mt-2 flex flex-wrap gap-1.5">{schedule.map((s) => <span key={s.id} className="chip tnum">{fmtTime(s.time)} · {s.kind}</span>)}</div>
        <p className="mt-3 leading-relaxed">Web apps cannot run timers once the browser has fully closed. Reminders fire while this app is open in a tab or installed to your home screen (on iPhone, install it first via Share → Add to Home Screen). For alerts that work with the app closed, download the calendar file and open it in your phone's calendar app. It sets daily repeating events for 60 days.</p>
      </details>
    </section>
  );
}

function ProgressLog() {
  const { state, day, today, toast } = useApp();
  const { photos, addPhoto, removePhoto } = useData();
  const [kind, setKind] = useState<"front" | "side">("front");
  const [pick, setPick] = useState<Record<number, string>>({});
  const file = useRef<HTMLInputElement>(null);
  const list = photos.filter((p) => p.kind === kind);
  const slots = [1, 30, 60];
  void state;

  const nearest = (target: number): PhotoRecord | undefined => {
    if (!list.length) return undefined;
    return [...list].sort((a, b) => Math.abs(a.day - target) - Math.abs(b.day - target) || a.ts - b.ts)[0];
  };

  const add = async (f: File) => {
    try {
      const dataUrl = await fileToDataUrl(f);
      await addPhoto({ id: uid(), ts: Date.now(), dateKey: today, day: Math.min(60, Math.max(1, day)), kind, dataUrl });
      toast("Photo added");
    } catch { toast("Could not read that image"); }
  };

  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle eyebrow="Progress log" title="Day 1 vs Day 30 vs Day 60" />
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-line bg-white/[0.04] p-1">{(["front", "side"] as const).map((k) => <button key={k} onClick={() => setKind(k)} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${kind === k ? "bg-vio/50 text-white" : "text-ink-3"}`}>{k}</button>)}</div>
          <button className="btn btn-sm" onClick={() => file.current?.click()}><Icon name="plus" size={16} /> Add photo</button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f); e.target.value = ""; }} />
        </div>
      </div>
      <div className="mx-auto mt-4 grid max-w-2xl grid-cols-3 gap-2 sm:gap-4">
        {slots.map((t) => {
          const chosen = list.find((p) => p.id === pick[t]) ?? nearest(t);
          const unlocked = day >= t;
          return (
            <div key={t} className="grid gap-2">
              <div className="flex items-center justify-between"><span className="label">Day {t}</span>{!unlocked && <Icon name="lock" size={12} className="text-ink-3" />}</div>
              <div className="relative overflow-hidden rounded-xl border border-line bg-black/40" style={{ aspectRatio: "3 / 4" }}>
                {chosen ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={chosen.dataUrl} alt={`Day ${chosen.day} ${kind}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-2 text-center text-[11px] text-ink-3">{unlocked ? "No photo yet. Add one or run a scan." : "Unlocks on this day"}</div>}
                {chosen && <span className="chip absolute bottom-1.5 left-1.5 !bg-black/60 tnum">Day {chosen.day}</span>}
              </div>
              {list.length > 1 && <select aria-label={`Photo for day ${t}`} className="!min-h-9 !py-1 text-xs" value={chosen?.id ?? ""} onChange={(e) => setPick({ ...pick, [t]: e.target.value })}>{list.map((p) => <option key={p.id} value={p.id}>Day {p.day} · {fmtDate(p.dateKey)}</option>)}</select>}
            </div>
          );
        })}
      </div>
      {list.length > 0 && (
        <details className="mt-4 text-xs text-ink-3"><summary className="cursor-pointer font-bold text-ink-2">All {kind} photos ({list.length})</summary>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">{list.map((p) => (
            <div key={p.id} className="relative overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={`Day ${p.day}`} className="aspect-[3/4] w-full object-cover" />
              <button className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-bad" aria-label="Delete photo" onClick={() => removePhoto(p.id)}><Icon name="trash" size={12} /></button>
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] tnum">D{p.day}</span>
            </div>))}</div></details>
      )}
      <p className="mt-3 text-[11px] text-ink-3">Compare like with like: same spot, same light, same distance, relaxed neutral face. Photos stay on this device.</p>
    </section>
  );
}
