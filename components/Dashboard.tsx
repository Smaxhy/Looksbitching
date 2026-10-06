"use client";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { useShell } from "./Shell";
import { useData } from "./data";
import { Bar, Icon, Ring, SectionTitle } from "./ui";
import { describe, EXERCISES, getDayPlan, MILESTONES, PROGRAM_DAYS, prescriptionMinutes } from "@/lib/program";
import { dayScore, habitItems, sleepAvg7d, waterRatio7d } from "@/lib/habits";
import { buildActions } from "@/lib/analysis";
import { STUDIES } from "@/lib/evidence";
import { addDays, fmtDate } from "@/lib/dates";

export function Dashboard() {
  const { state, day, today, streak, updateLog, setAction } = useApp();
  const { go, startSession, runExercise } = useShell();
  const { scans } = useData();
  const s = state.settings;
  const log = state.logs[today];
  const started = day >= 1;
  const finished = day > PROGRAM_DAYS;
  const shown = Math.min(PROGRAM_DAYS, Math.max(1, day));
  const plan = getDayPlan(shown);
  const items = habitItems(log, s, shown);
  const score = dayScore(log, s, shown);
  const left = Math.max(0, PROGRAM_DAYS - day);

  const latest = scans[scans.length - 1];
  const actions = useMemo(() => (latest ? buildActions(latest, { waterRatio7d: waterRatio7d(state.logs, s, today), sleepAvg7d: sleepAvg7d(state.logs, today) }) : []), [latest, state.logs, s, today]);
  const openActions = actions.filter((a) => !state.actionsDone[a.id]).slice(0, 3);
  const needsScan = plan.scanDay && !scans.some((x) => x.day === shown);

  const scienceIds = ["falla2007", "jull2002", "hughes2013", "axelsson2010", "shaker2002", "vispute2011", "palma2015", "camacho2015"];
  const sci = STUDIES[scienceIds[shown % scienceIds.length]];

  const water = log?.waterMl ?? 0;
  const bump = (fn: Parameters<typeof updateLog>[1]) => updateLog(today, fn);

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* hero */}
      <section className="glass relative overflow-hidden p-5 sm:p-7 lg:col-span-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-vio/25 blur-3xl" />
        <div className="relative flex h-full flex-wrap items-center gap-6">
          <Ring value={started ? Math.min(1, day / PROGRAM_DAYS) : 0} size={132} stroke={12} tone="vio">
            <div>
              <div className="font-display text-4xl font-extrabold tnum">{started ? Math.min(day, PROGRAM_DAYS) : 0}</div>
              <div className="label -mt-1">of 60</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1" style={{ minWidth: "12rem" }}>
            <div className="label">{!started ? "Starts soon" : finished ? "Programme complete" : `Week ${plan.week} · ${plan.spec.phase}`}</div>
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {!started ? `Day 1 is ${fmtDate(s.startDate, { weekday: "long", month: "short", day: "numeric" })}` : finished ? "You finished all 60 days" : `Day ${day} of 60`}
            </h1>
            <p className="mt-1 text-sm text-ink-2">{finished ? "Run a final scan and compare it to day 1 in Routine." : started ? `${left} day${left === 1 ? "" : "s"} left. ${plan.rest ? "Recovery day: light work only." : plan.spec.blurb}` : "Review the exercises in the Posture tab while you wait."}</p>
            <div className="mt-4"><Bar value={Math.min(1, Math.max(0, day) / PROGRAM_DAYS)} tone="vio" h={10} /></div>
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-ink-3"><span>Day 1</span><span>Day 30</span><span>Day 60</span></div>
          </div>
        </div>
      </section>

      {/* streak */}
      <section className="glass p-5 lg:col-span-4">
        <SectionTitle eyebrow="Streak" title={`${streak.current} day${streak.current === 1 ? "" : "s"}`} />
        <p className="mt-1 text-xs text-ink-3">A day counts at 60% of today's checklist. Best: {streak.best}.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {MILESTONES.map((m) => {
            const got = streak.best >= m;
            return (
              <div key={m} className={`grid place-items-center gap-1 rounded-2xl border p-3 text-center ${got ? "border-emr-2/40 bg-emr/10" : "border-line bg-white/[0.03]"}`}>
                <span className={`grid h-10 w-10 place-items-center rounded-full ${got ? "bg-gradient-to-br from-emr to-emr-3 text-[#04140d]" : "bg-white/[0.06] text-ink-3"}`}><Icon name={got ? "trophy" : "lock"} size={20} /></span>
                <div className="font-display text-lg font-extrabold tnum">{m}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3">{got ? "Earned" : `${Math.max(0, m - streak.current)} to go`}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* today's focus */}
      <section className="glass p-5 lg:col-span-7">
        <SectionTitle eyebrow="Today's focus" title={plan.rest ? "Recovery day" : "Your sessions"} action={<span className="chip chip-vio">Week {plan.week}</span>} />
        {needsScan && (
          <button onClick={() => go("scan")} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-emr-2/40 bg-emr/10 p-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emr/25 text-emr-3"><Icon name="scan" size={22} /></span>
            <span className="flex-1"><b className="block text-sm">{plan.milestone} due</b><span className="text-xs text-ink-2">Take front and side photos in the same light as before.</span></span>
            <Icon name="chev" size={18} />
          </button>
        )}
        <div className="mt-4 grid gap-3">
          {(["am", "pm"] as const).map((k) => {
            const list = k === "am" ? plan.morning : plan.evening;
            const done = k === "am" ? log?.sessionAM : log?.sessionPM;
            const mins = list.reduce((a, p) => a + prescriptionMinutes(p), 0);
            return (
              <div key={k} className={`rounded-2xl border p-4 ${done ? "border-emr-2/30 bg-emr/[0.07]" : "border-line bg-white/[0.03]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold"><Icon name={k === "am" ? "sun" : "moon"} size={18} className={k === "am" ? "text-warn" : "text-vio-3"} />{k === "am" ? "Morning" : "Evening"} <span className="text-xs font-semibold text-ink-3">~{mins} min</span></div>
                  {done ? <span className="chip chip-emr"><Icon name="check" size={14} /> Done</span> : <button className="btn btn-vio btn-sm" disabled={!started || finished} onClick={() => startSession(k)}><Icon name="play" size={14} /> Start</button>}
                </div>
                <ul className="mt-3 grid gap-1.5">
                  {list.map((p, i) => (
                    <li key={i}>
                      <button className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5" onClick={() => runExercise(p.exercise)}>
                        <span className="min-w-0 truncate font-semibold">{EXERCISES[p.exercise].name}</span>
                        <span className="shrink-0 text-xs text-ink-3 tnum">{describe(p)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* quick check-in */}
      <section className="glass p-5 lg:col-span-5">
        <div className="flex items-center justify-between"><SectionTitle eyebrow="Quick check-in" title="Log it fast" /><Ring value={score} size={64} stroke={7}><span className="text-sm font-extrabold tnum">{Math.round(score * 100)}%</span></Ring></div>
        <div className="mt-4 grid gap-3">
          <div className="glass-flat p-3">
            <div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-bold"><Icon name="drop" size={18} className="text-vio-3" /> Water</span><span className="tnum text-ink-2">{(water / 1000).toFixed(2)} / {(s.waterTargetMl / 1000).toFixed(1)} L</span></div>
            <Bar value={water / s.waterTargetMl} tone="vio" />
            <div className="mt-3 flex gap-2">
              <button className="btn btn-sm flex-1" onClick={() => bump((l) => ({ ...l, waterMl: l.waterMl + 250 }))}>+ Glass</button>
              <button className="btn btn-sm flex-1" onClick={() => bump((l) => ({ ...l, waterMl: l.waterMl + 500 }))}>+ Bottle</button>
              <button className="btn btn-sm btn-ghost" aria-label="Undo water" onClick={() => bump((l) => ({ ...l, waterMl: Math.max(0, l.waterMl - 250) }))}>−</button>
            </div>
          </div>
          <div className="glass-flat flex items-center justify-between gap-3 p-3">
            <div className="text-sm"><div className="flex items-center gap-2 font-bold"><Icon name="posture" size={18} className="text-emr-2" /> Posture check-in</div><div className="text-xs text-ink-3 tnum">{log?.postureChecks ?? 0} of {plan.postureTarget} today</div></div>
            <button className="btn btn-emr btn-sm" onClick={() => bump((l) => ({ ...l, postureChecks: l.postureChecks + 1 }))}>Check in</button>
          </div>
          <div className="glass-flat flex items-center justify-between gap-3 p-3">
            <label htmlFor="dash-sleep" className="flex items-center gap-2 text-sm font-bold"><Icon name="moon" size={18} className="text-vio-3" /> Last night's sleep</label>
            <div className="flex items-center gap-2"><input id="dash-sleep" type="number" step={0.5} min={0} max={14} inputMode="decimal" className="!w-20 text-center" placeholder="h" value={log?.sleepHours ?? ""} onChange={(e) => bump((l) => ({ ...l, sleepHours: e.target.value === "" ? null : Math.min(14, Math.max(0, Number(e.target.value))) }))} /><span className="text-xs text-ink-3">h</span></div>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 text-ink-2"><span className={`grid h-4 w-4 place-items-center rounded-full ${i.frac >= 1 ? "bg-emr text-[#04140d]" : "bg-white/10 text-transparent"}`}><Icon name="check" size={11} stroke={3} /></span><span className="truncate">{i.label}</span></li>
          ))}
        </ul>
      </section>

      {/* glow-up actions */}
      <section className="glass p-5 lg:col-span-7">
        <SectionTitle eyebrow="From your latest scan" title="Next glow-up moves" action={<button className="btn btn-sm" onClick={() => go("scan")}>Open scan</button>} />
        {!latest ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line p-5 text-sm text-ink-2">No scan yet. A baseline scan on day 1 gives you a personalised action list and something to compare against on day 30 and 60.
            <div className="mt-3"><button className="btn btn-vio btn-sm" onClick={() => go("scan")}><Icon name="camera" size={16} /> Take baseline scan</button></div></div>
        ) : (
          <ul className="mt-4 grid gap-2.5">
            {openActions.length === 0 && <li className="text-sm text-ink-2">All actions from your latest scan are done. Run another scan to refresh the list.</li>}
            {openActions.map((a) => (
              <li key={a.id} className="glass-flat flex items-start gap-3 p-3">
                <button aria-label={`Mark ${a.title} done`} className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-white/5 hover:bg-emr/30" onClick={() => setAction(a.id, true)}><Icon name="check" size={14} /></button>
                <div className="min-w-0"><div className="text-sm font-bold">{a.title}</div><div className="text-xs text-ink-2">{a.why}</div></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass p-5 lg:col-span-5">
        <div className="label">Science note · {sci.cite.split(".")[0]}</div>
        <p className="mt-2 text-sm leading-relaxed">{sci.finding}</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">{sci.caveat}</p>
        <button className="btn btn-sm mt-3" onClick={() => go("posture")}><Icon name="book" size={16} /> All evidence</button>
        <div className="mt-4 text-[11px] text-ink-3">Next scan days: {[1, 30, 60].filter((d) => d >= day).map((d) => `Day ${d} (${fmtDate(addDays(s.startDate, d - 1))})`).join(" · ") || "done"}</div>
      </section>
    </div>
  );
}
