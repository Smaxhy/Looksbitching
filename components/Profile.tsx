"use client";
import { useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { useData } from "./data";
import { dateKey } from "@/lib/dates";
import { Icon, Modal } from "./ui";

export function Profile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setSettings, resetAll, importState, toast } = useApp();
  const { photos, scans, wipe, bulkImport } = useData();
  const s = state.settings;
  const [confirm, setConfirm] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ app: "looksbitching", exported: new Date().toISOString(), state, photos, scans })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `looksbitching-backup-${dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Backup downloaded");
  };

  const importFile = async (f: File) => {
    try {
      const j = JSON.parse(await f.text());
      if (j.app !== "looksbitching") throw new Error("bad file");
      importState(j.state);
      await bulkImport(j.photos ?? [], j.scans ?? []);
      toast("Backup restored");
    } catch { toast("That file is not a Looksbitching backup"); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Profile and settings">
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="p-name" className="label mb-1.5 block">Name</label><input id="p-name" type="text" value={s.name} onChange={(e) => setSettings({ name: e.target.value })} /></div>
          <div><label htmlFor="p-start" className="label mb-1.5 block">Day 1</label><input id="p-start" type="date" value={s.startDate} onChange={(e) => e.target.value && setSettings({ startDate: e.target.value })} /></div>
          <div><label htmlFor="p-water" className="label mb-1.5 block">Water target (ml)</label><input id="p-water" type="number" min={1000} max={6000} step={250} value={s.waterTargetMl} onChange={(e) => setSettings({ waterTargetMl: Math.max(500, Number(e.target.value) || 2500) })} /></div>
          <div><label htmlFor="p-sleep" className="label mb-1.5 block">Sleep target (h)</label><input id="p-sleep" type="number" min={5} max={10} step={0.5} value={s.sleepTargetH} onChange={(e) => setSettings({ sleepTargetH: Math.min(10, Math.max(5, Number(e.target.value) || 7.5)) })} /></div>
        </div>
        <button className="btn" onClick={() => { setSettings({ startDate: dateKey() }); toast("Program restarted from today"); onClose(); }}><Icon name="reset" size={18} /> Restart the 60 days from today</button>
        <div className="grid gap-2 border-t border-line pt-4">
          <div className="label">Your data</div>
          <p className="text-sm text-ink-2">Stored only in this browser: {Object.keys(state.logs).length} logged days, {photos.length} photos, {scans.length} scans.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm" onClick={exportAll}><Icon name="download" size={16} /> Export backup</button>
            <button className="btn btn-sm" onClick={() => file.current?.click()}><Icon name="upload" size={16} /> Restore backup</button>
            <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
          </div>
          {!confirm ? (
            <button className="btn btn-sm w-fit text-bad" onClick={() => setConfirm(true)}><Icon name="trash" size={16} /> Delete everything</button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-bad/30 bg-bad/10 p-3 text-sm">
              <span className="flex-1">This permanently deletes all progress, photos and scans.</span>
              <button className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn btn-sm !border-bad/50 !bg-bad/20 text-bad" onClick={async () => { await wipe(); resetAll(); setConfirm(false); onClose(); }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
