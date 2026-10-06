"use client";
import { Icon, Modal } from "./ui";
import { Demo, PostureCompare } from "./Demo";

const Section = ({ title, icon, children, open }: { title: string; icon: string; children: React.ReactNode; open?: boolean }) => (
  <details open={open} className="glass-flat group overflow-hidden">
    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 font-bold marker:hidden">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-vio/20 text-vio-3"><Icon name={icon} size={18} /></span>
      <span className="flex-1">{title}</span>
      <span className="text-ink-3 transition group-open:rotate-90"><Icon name="chev" size={18} /></span>
    </summary>
    <div className="grid gap-3 px-4 pb-4 text-sm text-ink-2">{children}</div>
  </details>
);

export function Help({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="How it works" wide>
      <div className="grid gap-3">
        <Section open icon="sparkle" title="Your day in 4 steps">
          <ol className="grid gap-2">
            {["Morning: tap Start on the Today screen and follow the timer (about 4 minutes).", "Through the day: tap “Check in” when you fix your posture, and add water as you drink.", "Evening: do the second session, then log your skincare and sleep.", "Days 1, 30 and 60: take a front and side photo in the Scan tab to see your change."].map((t, i) => (
              <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emr/25 text-xs font-extrabold text-emr-3">{i + 1}</span>{t}</li>
            ))}
          </ol>
          <p className="text-xs text-ink-3">A day counts toward your streak once you finish 60% of the checklist. You don't need to be perfect.</p>
        </Section>
        <Section icon="posture" title="Doing an exercise">
          <p>Open the Posture tab, then Exercise library. Every card is animated and has numbered steps, common mistakes and a safety note. The timer runs holds, rests and sets for you and beeps at each change.</p>
          <Demo id="chin-tuck" />
        </Section>
        <Section icon="posture" title="What good posture looks like"><PostureCompare /></Section>
        <Section icon="scan" title="Taking a scan photo">
          <ul className="grid gap-1.5">
            {["Same spot, same light, same distance every time. Soft daylight from a window in front of you works best.", "Camera at eye level, arm's length or on a stack of books. The 5-second timer frees both hands.", "Front: chin level, relaxed face, hair off your forehead, no filters.", "Side: turn 90°, look straight ahead, shoulders relaxed, base of the neck in frame. Then tap the 2 angles on the photo."].map((t, i) => <li key={i} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-emr-2" />{t}</li>)}
          </ul>
        </Section>
        <Section icon="bell" title="Reminders on your phone">
          <p>Turn them on in Routine. They fire while the app is open or installed (iPhone: Share, then Add to Home Screen). For alerts that work with the app closed, download the calendar file there and open it in your phone's calendar.</p>
        </Section>
        <Section icon="book" title="Plain-English glossary">
          <dl className="grid gap-2">
            {[["Hyoid", "A small U-shaped bone under your chin that muscles hold in place. Training the muscles around it helps swallowing and neck control. It does not reshape your jaw."], ["Mewing", "Resting your whole tongue on the roof of your mouth. Free and harmless, but no adult studies show it changes jaw shape."], ["CVA", "Craniovertebral angle: how far forward your head sits. About 50° or more is typical."], ["CMA", "Cervicomental angle: the angle under your chin. 105–120° is the classic benchmark. Body fat and head posture affect it most."], ["Recovery day", "Every 7th day is light on purpose so your neck and jaw can adapt."]].map(([t, d]) => <div key={t}><dt className="font-bold text-ink">{t}</dt><dd>{d}</dd></div>)}
          </dl>
        </Section>
      </div>
    </Modal>
  );
}

export function Confetti() {
  const colors = ["#8b5cf6", "#34d399", "#c4b5fd", "#6ee7b7", "#fbbf24"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 46 }, (_, i) => (
        <span key={i} className="absolute top-0 block h-3 w-2 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animation: `confetti ${2.2 + (i % 5) * 0.35}s ${(i % 9) * 0.09}s ease-in forwards`, opacity: 0 }} />
      ))}
    </div>
  );
}
