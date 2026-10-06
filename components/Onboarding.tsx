"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { dateKey } from "@/lib/dates";
import { Icon } from "./ui";

export function Onboarding() {
  const { setSettings, state } = useApp();
  const [name, setName] = useState(state.settings.name);
  const [start, setStart] = useState(dateKey());
  const [ok, setOk] = useState(false);

  return (
    <div className="mx-auto grid min-h-full max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-2" style={{ paddingTop: "calc(2.5rem + var(--safe-t))" }}>
      <div className="grid gap-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-vio to-emr shadow-lg shadow-vio/40"><Icon name="sparkle" size={26} className="text-white" /></span>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">60 days. Posture first, then everything that actually moves the needle.</h1>
        <p className="max-w-md text-ink-2">Neck posture training, hyoid-muscle strength, skincare, sleep and hydration, with a facial scan to track change. Built on published research, with the evidence level shown on every exercise.</p>
        <ul className="grid gap-2 text-sm">
          <li className="flex gap-2"><span className="text-emr-2"><Icon name="check" size={18} /></span><span><b>Strong evidence:</b> neck flexor training, daily sunscreen, sleep, lowering body fat.</span></li>
          <li className="flex gap-2"><span className="text-emr-2"><Icon name="check" size={18} /></span><span><b>Real but narrow:</b> suprahyoid and tongue strengthening (swallowing research, not jawline research).</span></li>
          <li className="flex gap-2"><span className="text-bad"><Icon name="x" size={18} /></span><span><b>Unproven:</b> that mewing or hyoid raises reshape an adult jaw. The app says so wherever it matters.</span></li>
        </ul>
      </div>
      <div className="glass grid gap-4 p-6">
        <div>
          <label htmlFor="ob-name" className="label mb-1.5 block">Your name</label>
          <input id="ob-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="ob-start" className="label mb-1.5 block">Day 1 is</label>
          <input id="ob-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-black/20 p-3 text-sm text-ink-2">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>I understand this is self-improvement guidance, not medical advice. I will stop any exercise that causes pain, dizziness, numbness or trouble swallowing, and see a clinician if symptoms persist. Scores come from on-device estimates and are not diagnoses.</span>
        </label>
        <button className="btn btn-vio w-full" disabled={!ok || !start} onClick={() => setSettings({ name: name.trim(), startDate: start, acknowledged: true })}>Start my 60 days <Icon name="chev" size={18} /></button>
        <p className="flex items-center gap-2 text-xs text-ink-3"><Icon name="lock" size={14} /> Data, photos and scans stay in this browser. Nothing is uploaded.</p>
      </div>
    </div>
  );
}
