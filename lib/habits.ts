import type { DayLog, Settings } from "./types";
import { getDayPlan, PROGRAM_DAYS } from "./program";
import { addDays, diffDays } from "./dates";

export const AM_STEPS = [
  { id: "cleanse", label: "Cleanse", hint: "Gentle cleanser, lukewarm water" },
  { id: "moisturize", label: "Moisturise", hint: "Ceramide or hyaluronic moisturiser" },
  { id: "spf", label: "Sunscreen SPF 30+", hint: "Daily SPF has the strongest anti-ageing evidence" },
];
export const PM_STEPS = [
  { id: "cleanse", label: "Cleanse", hint: "Remove sunscreen and grime" },
  { id: "moisturize", label: "Moisturise", hint: "Seal in hydration" },
  { id: "actives", label: "Retinoid (2–3 nights/week) or rest night", hint: "Start low. Skip if irritated" },
];

export const emptyLog = (): DayLog => ({
  waterMl: 0, amSteps: [], pmSteps: [], postureChecks: 0, sessionAM: false, sessionPM: false, sleepHours: null, done: [],
});

export interface HabitItem {
  id: string;
  label: string;
  frac: number; // 0..1
  detail: string;
}

export function habitItems(log: DayLog | undefined, settings: Settings, day: number): HabitItem[] {
  const l = log ?? emptyLog();
  const plan = getDayPlan(Math.min(Math.max(day, 1), PROGRAM_DAYS));
  return [
    { id: "water", label: "Water", frac: Math.min(1, l.waterMl / settings.waterTargetMl), detail: `${(l.waterMl / 1000).toFixed(1)} / ${(settings.waterTargetMl / 1000).toFixed(1)} L` },
    { id: "am", label: "Skincare AM", frac: Math.min(1, l.amSteps.length / AM_STEPS.length), detail: `${l.amSteps.length}/${AM_STEPS.length} steps` },
    { id: "pm", label: "Skincare PM", frac: Math.min(1, l.pmSteps.length / PM_STEPS.length), detail: `${l.pmSteps.length}/${PM_STEPS.length} steps` },
    { id: "posture", label: "Posture check-ins", frac: Math.min(1, l.postureChecks / plan.postureTarget), detail: `${l.postureChecks}/${plan.postureTarget}` },
    { id: "ex-am", label: plan.rest ? "Morning reset" : "Morning session", frac: l.sessionAM ? 1 : 0, detail: l.sessionAM ? "Done" : "Pending" },
    { id: "ex-pm", label: plan.rest ? "Evening recovery" : "Evening session", frac: l.sessionPM ? 1 : 0, detail: l.sessionPM ? "Done" : "Pending" },
    { id: "sleep", label: "Sleep", frac: l.sleepHours == null ? 0 : Math.min(1, l.sleepHours / settings.sleepTargetH), detail: l.sleepHours == null ? "Not logged" : `${l.sleepHours.toFixed(1)} h` },
  ];
}

export function dayScore(log: DayLog | undefined, settings: Settings, day: number): number {
  const items = habitItems(log, settings, day);
  return items.reduce((a, i) => a + i.frac, 0) / items.length;
}

/** A day "counts" toward the streak at 60% completion. */
export const COUNT_THRESHOLD = 0.6;

export function dayCounts(logs: Record<string, DayLog>, settings: Settings, key: string): boolean {
  const day = diffDays(settings.startDate, key) + 1;
  if (day < 1) return false;
  return dayScore(logs[key], settings, day) >= COUNT_THRESHOLD;
}

export function streaks(logs: Record<string, DayLog>, settings: Settings, today: string): { current: number; best: number; totalCounted: number } {
  const start = settings.startDate;
  const span = Math.max(0, diffDays(start, today));
  let best = 0, run = 0, total = 0;
  for (let i = 0; i <= span; i++) {
    const k = addDays(start, i);
    if (dayCounts(logs, settings, k)) { run++; total++; best = Math.max(best, run); } else if (k !== today) run = 0;
  }
  // current: walk back from today (today may still be in progress)
  let current = 0;
  let k = today;
  if (!dayCounts(logs, settings, k)) k = addDays(k, -1);
  while (diffDays(start, k) >= 0 && dayCounts(logs, settings, k)) { current++; k = addDays(k, -1); }
  return { current, best: Math.max(best, current), totalCounted: total };
}

/** Average water vs target over the last 7 program days that have any log (0..1). */
export function waterRatio7d(logs: Record<string, DayLog>, settings: Settings, today: string): number {
  let sum = 0, n = 0;
  for (let i = 0; i < 7; i++) {
    const l = logs[addDays(today, -i)];
    if (l) { sum += Math.min(1, l.waterMl / settings.waterTargetMl); n++; }
  }
  return n ? sum / n : 0.5;
}

export function sleepAvg7d(logs: Record<string, DayLog>, today: string): number | null {
  const v: number[] = [];
  for (let i = 0; i < 7; i++) { const s = logs[addDays(today, -i)]?.sleepHours; if (s != null) v.push(s); }
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
