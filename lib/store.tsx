"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { AppState, DayLog, Settings } from "./types";
import { dateKey, diffDays } from "./dates";
import { emptyLog, streaks } from "./habits";
import { PROGRAM_DAYS } from "./program";

const KEY = "lb:v1";

export const defaultSettings = (): Settings => ({
  name: "",
  startDate: dateKey(),
  waterTargetMl: 2500,
  sleepTargetH: 7.5,
  acknowledged: false,
  reminders: {
    enabled: false, posture: true, postureEveryMin: 120, wakeStart: "08:00", wakeEnd: "22:00",
    hyoid: true, hyoidAM: "08:30", hyoidPM: "20:00", skin: true, skinAM: "07:45", skinPM: "21:30", water: true, waterEveryMin: 150,
  },
});

const initial = (): AppState => ({ v: 1, settings: defaultSettings(), logs: {}, actionsDone: {} });

type Action =
  | { t: "load"; s: AppState }
  | { t: "settings"; p: Partial<Settings> }
  | { t: "reminders"; p: Partial<Settings["reminders"]> }
  | { t: "log"; key: string; fn: (l: DayLog) => DayLog }
  | { t: "action"; id: string; done: boolean }
  | { t: "reset" };

function reducer(s: AppState, a: Action): AppState {
  switch (a.t) {
    case "load": return a.s;
    case "settings": return { ...s, settings: { ...s.settings, ...a.p } };
    case "reminders": return { ...s, settings: { ...s.settings, reminders: { ...s.settings.reminders, ...a.p } } };
    case "log": return { ...s, logs: { ...s.logs, [a.key]: a.fn(s.logs[a.key] ?? emptyLog()) } };
    case "action": {
      const next = { ...s.actionsDone };
      if (a.done) next[a.id] = dateKey(); else delete next[a.id];
      return { ...s, actionsDone: next };
    }
    case "reset": return initial();
  }
}

function migrate(raw: unknown): AppState {
  const base = initial();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppState>;
  const dflt = defaultSettings();
  return {
    v: 1,
    settings: { ...dflt, ...(r.settings ?? {}), reminders: { ...dflt.reminders, ...(r.settings?.reminders ?? {}) } },
    logs: r.logs ?? {},
    actionsDone: r.actionsDone ?? {},
  };
}

interface Ctx {
  state: AppState;
  today: string;
  day: number; // program day for today (can be <1 or >60)
  streak: { current: number; best: number; totalCounted: number };
  setSettings: (p: Partial<Settings>) => void;
  setReminders: (p: Partial<Settings["reminders"]>) => void;
  updateLog: (key: string, fn: (l: DayLog) => DayLog) => void;
  setAction: (id: string, done: boolean) => void;
  resetAll: () => void;
  importState: (raw: unknown) => void;
  toast: (msg: string) => void;
  toasts: { id: number; msg: string }[];
}

const C = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(C);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(dateKey());
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const tid = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ t: "load", s: migrate(JSON.parse(raw)) });
    } catch { /* private mode etc. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  }, [state, ready]);

  // date rollover while the app stays open
  useEffect(() => {
    const tick = () => setToday((t) => { const n = dateKey(); return n === t ? t : n; });
    const i = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(i); document.removeEventListener("visibilitychange", tick); };
  }, []);

  const toast = useCallback((msg: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const day = diffDays(state.settings.startDate, today) + 1;
  const streak = useMemo(() => streaks(state.logs, state.settings, today), [state.logs, state.settings, today]);

  const value: Ctx = {
    state, today, day, streak, toast, toasts,
    setSettings: (p) => dispatch({ t: "settings", p }),
    setReminders: (p) => dispatch({ t: "reminders", p }),
    updateLog: (key, fn) => dispatch({ t: "log", key, fn }),
    setAction: (id, done) => dispatch({ t: "action", id, done }),
    resetAll: () => dispatch({ t: "reset" }),
    importState: (raw) => dispatch({ t: "load", s: migrate(raw) }),
  };

  if (!ready) return <div className="grid h-full place-items-center text-ink-3">Loading…</div>;
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const clampDay = (d: number) => Math.min(PROGRAM_DAYS, Math.max(1, d));
