"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { useShell } from "./Shell";
import { Bar, GradeChip, Icon, Modal, SectionTitle } from "./ui";
import { describe, EXERCISES, getDayPlan, PROGRAM_DAYS, REST_DAYS, WEEKS, studiesFor, type ExerciseId } from "@/lib/program";
import { STUDIES } from "@/lib/evidence";
import { addDays, fmtDate } from "@/lib/dates";
import { dayCounts } from "@/lib/habits";

type View = "calendar" | "library" | "evidence";

export function Posture() {
  const [view, setView] = useState<View>("calendar");
  const { day } = useApp();
  const plan = getDayPlan(Math.min(60, Math.max(1, day)));
  return (
    <div className="grid gap-5">
      <section className="glass relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -left-10 -top-12 h-48 w-48 rounded-full bg-emr/15 blur-3xl" />
        <div className="relative">
          <div className="label">60-day hyoid and posture blueprint</div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Week {plan.week}: {plan.spec.phase}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">{plan.spec.blurb}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Stat label="Hyoid hold" value={`${plan.spec.hyoid.hold}s`} sub={`${plan.spec.hyoid.sets} × ${plan.spec.hyoid.reps}`} pct={plan.spec.hyoid.hold / 10} tone="vio" />
            <Stat label="Chin tuck" value={`${plan.spec.tuck.sets} × ${plan.spec.tuck.reps}`} sub={plan.spec.tuck.resisted ? "resisted" : `hold ${plan.spec.tuck.hold}s`} pct={(plan.spec.tuck.sets * plan.spec.tuck.reps) / 45} tone="emr" />
            <Stat label="Neck flexor curl" value={plan.spec.curl ? `${plan.spec.curl.sets} × ${plan.spec.curl.reps}` : "Unlocks wk 2"} sub={plan.spec.curl ? `hold ${plan.spec.curl.hold}s` : "build the habit first"} pct={plan.spec.curl ? (plan.spec.curl.sets * plan.spec.curl.reps) / 45 : 0} tone="emr" />
          </div>
        </div>
      </section>

      <div className="flex gap-1 rounded-2xl border border-line bg-white/[0.04] p-1" role="tablist">
        {([["calendar", "60-day calendar", "list"], ["library", "Exercise library", "posture"], ["evidence", "The evidence", "book"]] as const).map(([id, l, ic]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold sm:text-sm ${view === id ? "bg-gradient-to-r from-vio/60 to-vio/30 text-white" : "text-ink-3 hover:text-ink"}`}>
            <Icon name={ic} size={16} /> {l}
          </button>
        ))}
      </div>
      {view === "calendar" && <CalendarView />}
      {view === "library" && <Library />}
      {view === "evidence" && <Evidence />}
    </div>
  );
}

function Stat({ label, value, sub, pct, tone }: { label: string; value: string; sub: string; pct: number; tone: "vio" | "emr" }) {
  return (
    <div className="glass-flat p-3">
      <div className="label">{label}</div>
      <div className="mt-1 flex items-baseline gap-2"><span className="font-display text-2xl font-extrabold tnum">{value}</span><span className="text-xs text-ink-3">{sub}</span></div>
      <div className="mt-2"><Bar value={pct} tone={tone} h={6} /></div>
    </div>
  );
}

function CalendarView() {
  const { state, day, today } = useApp();
  const [sel, setSel] = useState<number | null>(null);
  const s = state.settings;
  return (
    <section className="grid gap-5">
      {WEEKS.map((w) => {
        const days = Array.from({ length: 7 }, (_, i) => (w.week - 1) * 7 + i + 1).filter((d) => d <= PROGRAM_DAYS);
        return (
          <div key={w.week} className="glass p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="font-display text-lg font-extrabold">Week {w.week}</span><span className="chip chip-vio">{w.phase}</span></div>
              <span className="text-xs text-ink-3 tnum">hold {w.hyoid.hold}s · {w.hyoid.sets}×{w.hyoid.reps}</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map((d) => {
                const key = addDays(s.startDate, d - 1);
                const locked = d > day;
                const isToday = d === day;
                const log = state.logs[key];
                const both = log?.sessionAM && log?.sessionPM;
                const counted = !locked && dayCounts(state.logs, s, key);
                const missed = !locked && !isToday && !counted;
                const p = getDayPlan(d);
                return (
                  <button key={d} onClick={() => setSel(d)} aria-label={`Day ${d}${locked ? " locked" : ""}`}
                    className={`relative flex h-14 flex-col sm:h-16 lg:h-[4.25rem] items-center justify-center rounded-xl border text-sm font-bold transition ${
                      isToday ? "border-vio-2 bg-vio/25 text-white shadow-[0_0_0_3px_rgba(139,92,246,.25)]"
                      : both ? "border-emr-2/50 bg-emr/20 text-emr-3"
                      : counted ? "border-emr-2/30 bg-emr/10 text-emr-3"
                      : locked ? "border-line bg-white/[0.02] text-ink-3/70"
                      : missed ? "border-line bg-white/[0.04] text-ink-3" : "border-line bg-white/[0.04]"}`}>
                    <span className="tnum">{d}</span>
                    <span className="absolute bottom-1 text-[9px]">
                      {locked ? <Icon name="lock" size={10} /> : both ? <Icon name="check" size={11} stroke={3} /> : REST_DAYS.has(d) ? <Icon name="moon" size={10} /> : null}
                    </span>
                    {p.scanDay && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warn" title={p.milestone} />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-ink-3">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-vio/60" /> Today</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-emr/50" /> Done</span>
        <span className="flex items-center gap-1.5"><Icon name="moon" size={11} /> Recovery</span>
        <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-warn" /> Scan day</span>
        <span className="flex items-center gap-1.5"><Icon name="lock" size={11} /> Unlocks on its day</span>
      </div>
      <DayModal day={sel} onClose={() => setSel(null)} today={today} current={day} start={s.startDate} />
    </section>
  );
}

function DayModal({ day, onClose, today, current, start }: { day: number | null; onClose: () => void; today: string; current: number; start: string }) {
  const { startSession, runExercise } = useShell();
  const { state } = useApp();
  if (day == null) return <Modal open={false} onClose={onClose} title="" children={null} />;
  const plan = getDayPlan(day);
  const locked = day > current;
  const key = addDays(start, day - 1);
  const log = state.logs[key];
  const isToday = key === today;
  return (
    <Modal open onClose={onClose} title={`Day ${day} · ${fmtDate(key, { weekday: "short", month: "short", day: "numeric" })}`}>
      {locked ? (
        <div className="grid gap-3 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/10 text-ink-3"><Icon name="lock" size={26} /></span>
          <p className="text-ink-2">Unlocks in {day - current} day{day - current === 1 ? "" : "s"}. This is a Week {plan.week} ({plan.spec.phase}) {plan.rest ? "recovery day" : "training day"}{plan.milestone ? ` with your ${plan.milestone.toLowerCase()}` : ""}.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-ink-2">{plan.rest ? "Recovery day. Skip loaded holds and let the neck and jaw rest." : plan.spec.blurb}</p>
          {plan.milestone && <span className="chip chip-warn w-fit">{plan.milestone}</span>}
          {(["am", "pm"] as const).map((k) => {
            const list = k === "am" ? plan.morning : plan.evening;
            const done = k === "am" ? log?.sessionAM : log?.sessionPM;
            return (
              <div key={k} className="glass-flat p-3">
                <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><Icon name={k === "am" ? "sun" : "moon"} size={16} />{k === "am" ? "Morning" : "Evening"}</div>
                  {done ? <span className="chip chip-emr"><Icon name="check" size={13} /> Done</span> : isToday ? <button className="btn btn-vio btn-sm" onClick={() => { onClose(); startSession(k); }}><Icon name="play" size={14} /> Start</button> : <span className="chip">Not logged</span>}</div>
                <ul className="grid gap-1 text-sm">{list.map((p, i) => <li key={i} className="flex justify-between gap-3"><button className="truncate text-left font-semibold hover:text-vio-3" onClick={() => { onClose(); runExercise(p.exercise); }}>{EXERCISES[p.exercise].name}</button><span className="shrink-0 text-xs text-ink-3 tnum">{describe(p)}</span></li>)}</ul>
              </div>
            );
          })}
          <div className="text-xs text-ink-3">Posture check-ins: {log?.postureChecks ?? 0}/{plan.postureTarget} · Water: {((log?.waterMl ?? 0) / 1000).toFixed(1)} L</div>
        </div>
      )}
    </Modal>
  );
}

function Library() {
  const [open, setOpen] = useState<ExerciseId | null>(null);
  const { day } = useApp();
  const { runExercise } = useShell();
  const plan = getDayPlan(Math.min(60, Math.max(1, day)));
  const all = [...plan.morning, ...plan.evening];
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {Object.values(EXERCISES).map((ex) => {
        const rx = all.find((p) => p.exercise === ex.id);
        return (
          <button key={ex.id} onClick={() => setOpen(ex.id)} className="glass flex flex-col gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-vio-2/40">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${ex.accent === "vio" ? "bg-vio/20 text-vio-3" : "bg-emr/20 text-emr-3"}`}><Icon name={ex.id === "chin-tuck" || ex.id === "neck-flexor-curl" ? "posture" : "zap"} size={22} /></span>
              <GradeChip grade={ex.grade} />
            </div>
            <div><div className="font-display text-lg font-bold leading-tight">{ex.name}</div><div className="mt-1 text-sm text-ink-2">{ex.short}</div></div>
            <div className="mt-auto flex items-center justify-between text-xs text-ink-3"><span>{ex.target}</span><span className="font-bold text-ink-2 tnum">{rx ? `Today: ${describe(rx)}` : "Not scheduled today"}</span></div>
          </button>
        );
      })}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? EXERCISES[open].name : ""} wide>
        {open && (() => {
          const ex = EXERCISES[open];
          return (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2"><GradeChip grade={ex.grade} /><span className="chip">{ex.target}</span></div>
              <p className="text-sm text-ink-2">{ex.evidenceNote}</p>
              <div><div className="label mb-2">How to do it</div><ol className="grid gap-2">{ex.steps.map((s, i) => <li key={i} className="glass-flat flex gap-3 p-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-vio/25 text-xs font-bold text-vio-3">{i + 1}</span>{s}</li>)}</ol></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><div className="label mb-2">Cues</div><ul className="grid gap-1.5 text-sm text-ink-2">{ex.cues.map((c, i) => <li key={i} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-emr-2" />{c}</li>)}</ul></div>
                <div><div className="label mb-2">Common mistakes</div><ul className="grid gap-1.5 text-sm text-ink-2">{ex.mistakes.map((c, i) => <li key={i} className="flex gap-2"><Icon name="x" size={16} className="mt-0.5 shrink-0 text-bad" />{c}</li>)}</ul></div>
              </div>
              <p className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-[#fde68a]"><b>Safety:</b> {ex.safety}</p>
              <div><div className="label mb-2">Research</div><ul className="grid gap-2">{studiesFor(open).map((s) => <li key={s.id} className="glass-flat p-3 text-xs"><div className="font-bold text-ink">{s.cite}</div><div className="mt-1 text-ink-2">{s.finding}</div></li>)}</ul></div>
              <button className="btn btn-vio" onClick={() => { setOpen(null); runExercise(open); }}><Icon name="play" size={18} /> Practice with timer</button>
            </div>
          );
        })()}
      </Modal>
    </section>
  );
}

function Evidence() {
  const list = Object.values(STUDIES);
  const groups: { title: string; hint: string; ids: string[]; tone: string }[] = [
    { title: "Works, with good evidence", hint: "These have randomised trials behind them.", ids: ["jull2002", "falla2007", "hughes2013", "vispute2011", "kaufman1998", "olsen2002"], tone: "text-emr-2" },
    { title: "Real effect, narrower than the hype", hint: "Shown for swallowing, tongue strength or breathing. Not for the jawline.", ids: ["shaker2002", "kahrilas1991", "yoon2014", "robbins2005", "camacho2015", "kafi2007"], tone: "text-warn" },
    { title: "Supportive or observational", hint: "Smaller studies and clinical benchmarks the scan relies on.", ids: ["yip2008", "ellenbogen1980", "coetzee2009", "palma2015", "axelsson2010", "oyetakin2015", "rhodes2006"], tone: "text-vio-3" },
    { title: "Unproven", hint: "Nothing in controlled adult research supports the strong claims.", ids: ["mewing"], tone: "text-bad" },
  ];
  return (
    <section className="grid gap-5">
      <div className="glass p-5">
        <SectionTitle eyebrow="Straight answer" title="What this programme can and cannot do" />
        <div className="mt-3 grid gap-3 text-sm text-ink-2 sm:grid-cols-2">
          <p><b className="text-ink">Can:</b> improve neck posture, strengthen the muscles that lift the hyoid and control the tongue, support better nasal-breathing habits, and, with skincare, sleep, hydration and fat loss, change how your face and neck look in photos.</p>
          <p><b className="text-ink">Cannot:</b> permanently raise your hyoid bone or reshape adult jaw bone with tongue posture. No controlled trial shows that. The visible jawline and chin–neck angle depend mostly on body fat, bone structure and head posture.</p>
        </div>
      </div>
      {groups.map((g) => (
        <div key={g.title} className="grid gap-3">
          <div className="px-1"><h3 className={`text-lg font-bold ${g.tone}`}>{g.title}</h3><p className="text-xs text-ink-3">{g.hint}</p></div>
          <div className="grid gap-3 md:grid-cols-2">
            {g.ids.map((id) => list.find((x) => x.id === id)).filter(Boolean).map((s) => (
              <article key={s!.id} className="glass flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><GradeChip grade={s!.grade} /><span className="text-[11px] text-ink-3">{s!.population}</span></div>
                <div className="text-sm font-bold">{s!.cite}</div>
                <p className="text-sm text-ink-2">{s!.finding}</p>
                <p className="text-xs text-ink-3"><b>Limit:</b> {s!.caveat}</p>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
