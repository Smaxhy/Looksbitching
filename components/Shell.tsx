"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Tab } from "@/lib/types";
import { useApp } from "@/lib/store";
import { getDayPlan, PROGRAM_DAYS, type ExerciseId, type Prescription } from "@/lib/program";
import { buildSchedule, dueReminders, ensureServiceWorker, markFired, showNotification } from "@/lib/notifications";
import { Icon, Toasts } from "./ui";
import { Runner } from "./Runner";
import { Dashboard } from "./Dashboard";
import { Posture } from "./Posture";
import { Scan } from "./Scan";
import { Routine } from "./Routine";
import { Onboarding } from "./Onboarding";
import { Profile } from "./Profile";
import { Help, Confetti } from "./Help";

interface ShellCtx {
  go: (t: Tab) => void;
  startSession: (which: "am" | "pm") => void;
  runExercise: (id: ExerciseId) => void;
  openProfile: () => void;
  openHelp: () => void;
}
const S = createContext<ShellCtx | null>(null);
export const useShell = () => {
  const c = useContext(S);
  if (!c) throw new Error("useShell outside provider");
  return c;
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Today", icon: "home" },
  { id: "posture", label: "Posture", icon: "posture" },
  { id: "scan", label: "Scan", icon: "scan" },
  { id: "routine", label: "Routine", icon: "list" },
];

export function Shell() {
  const { state, day, today, streak, toast, toasts, updateLog } = useApp();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [profile, setProfile] = useState(false);
  const [help, setHelp] = useState(false);
  const [party, setParty] = useState(0);
  const [runner, setRunner] = useState<{ title: string; items: Prescription[]; kind: "am" | "pm" | null; ids: ExerciseId[] } | null>(null);
  const s = state.settings;

  const go = useCallback((t: Tab) => { setTab(t); window.scrollTo({ top: 0 }); try { history.replaceState(null, "", `#${t}`); } catch { /* ignore */ } }, []);

  useEffect(() => {
    const h = location.hash.replace("#", "") as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h);
    ensureServiceWorker();
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "open-tab") go(e.data.tab); };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, [go]);

  // in-app reminder scheduler (browsers cannot run timers when the app is fully closed; see Routine tab)
  useEffect(() => {
    if (!s.reminders.enabled) return;
    const schedule = buildSchedule(s.reminders);
    const tick = async () => {
      const due = dueReminders(schedule);
      if (!due.length) return;
      markFired(due.map((d) => d.id));
      const latest = due[due.length - 1];
      const ok = await showNotification(latest.title, latest.body, latest.id, latest.tab);
      if (!ok || document.visibilityState === "visible") toast(`${latest.title}: ${latest.body}`);
    };
    tick();
    const i = setInterval(tick, 20_000);
    return () => clearInterval(i);
  }, [s.reminders, toast]);

  const plan = useMemo(() => getDayPlan(Math.min(PROGRAM_DAYS, Math.max(1, day))), [day]);

  const ctx: ShellCtx = {
    go,
    openProfile: () => setProfile(true),
    openHelp: () => setHelp(true),
    startSession: (which) => {
      const items = which === "am" ? plan.morning : plan.evening;
      setRunner({ title: `${which === "am" ? "Morning" : "Evening"} session · Day ${plan.day}`, items, kind: which, ids: items.map((i) => i.exercise) });
    },
    runExercise: (id) => {
      const all = [...plan.morning, ...plan.evening];
      const p = all.find((x) => x.exercise === id) ?? getDayPlan(Math.max(1, plan.day)).evening.find((x) => x.exercise === id) ?? all[0];
      setRunner({ title: "Practice", items: [p], kind: null, ids: [id] });
    },
  };

  if (!s.acknowledged) return <Onboarding />;

  return (
    <S.Provider value={ctx}>
      <div className="mx-auto flex min-h-full w-full max-w-[1200px] lg:gap-6 lg:px-6">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 py-6 lg:flex">
          <Brand />
          <nav className="grid gap-1.5" aria-label="Main">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${tab === t.id ? "bg-gradient-to-r from-vio/30 to-vio/5 text-white ring-1 ring-vio-2/40" : "text-ink-2 hover:bg-white/5"}`}>
                <Icon name={t.icon} size={20} className={tab === t.id ? "text-vio-3" : ""} /> {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto glass-flat p-4 text-xs text-ink-3">Everything stays on this device. Photos and scans are never uploaded.</div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-bg/70 px-4 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pt-6 lg:backdrop-blur-none" style={{ paddingTop: "calc(var(--safe-t) + .6rem)", paddingBottom: ".6rem" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="lg:hidden"><Brand compact /></div>
              <div className="hidden lg:block"><div className="label">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setHelp(true)} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white/5 text-sm font-extrabold text-vio-3 hover:bg-white/10" aria-label="How it works" title="How it works">?</button>
                <div className="chip chip-warn !px-3 !py-1.5 text-sm" title="Current streak"><Icon name="flame" size={16} /> <span className="tnum">{streak.current}</span> day{streak.current === 1 ? "" : "s"}</div>
                <button onClick={() => setProfile(true)} className="flex items-center gap-2 rounded-full border border-line bg-white/5 py-1 pl-1 pr-3 text-sm font-bold hover:bg-white/10" aria-label="Profile and settings">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-vio to-emr text-sm font-extrabold text-white">{(s.name || "You").slice(0, 1).toUpperCase()}</span>
                  <span className="hidden max-w-[7rem] truncate sm:inline">{s.name || "You"}</span>
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 pb-32 pt-4 lg:px-0 lg:pb-12" style={{ paddingBottom: "calc(7rem + var(--safe-b))" }}>
            <div key={tab} className="rise">
              {tab === "dashboard" && <Dashboard />}
              {tab === "posture" && <Posture />}
              {tab === "scan" && <Scan />}
              {tab === "routine" && <Routine />}
            </div>
          </main>
        </div>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#0b0916]/85 backdrop-blur-2xl lg:hidden" style={{ paddingBottom: "var(--safe-b)" }} aria-label="Main">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${tab === t.id ? "text-white" : "text-ink-3"}`}>
              {tab === t.id && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-gradient-to-r from-vio-2 to-emr-2" />}
              <Icon name={t.icon} size={22} className={tab === t.id ? "text-vio-3" : ""} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <Toasts toasts={toasts} />
      <Profile open={profile} onClose={() => setProfile(false)} />
      <Help open={help} onClose={() => setHelp(false)} />
      {party > 0 && <Confetti key={party} />}
      {runner && (
        <Runner
          open
          title={runner.title}
          items={runner.items}
          onClose={() => setRunner(null)}
          onComplete={() => {
            const kind = runner.kind;
            updateLog(today, (l) => ({ ...l, done: [...new Set([...l.done, ...runner.ids])], ...(kind === "am" ? { sessionAM: true } : {}), ...(kind === "pm" ? { sessionPM: true } : {}) }));
            toast(kind ? "Session logged. Nice work." : "Practice logged");
            if (kind) { setParty(Date.now()); setTimeout(() => setParty(0), 4200); }
          }}
        />
      )}
    </S.Provider>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-vio to-emr shadow-lg shadow-vio/30"><Icon name="sparkle" size={20} className="text-white" /></span>
      <div className="leading-tight">
        <div className="font-display text-lg font-extrabold">Looksbitching</div>
        {!compact && <div className="text-xs text-ink-3">60-day glow-up</div>}
      </div>
    </div>
  );
}
