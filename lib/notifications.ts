import type { ReminderSettings } from "./types";
import { BASE } from "./base";
import { fmtTime, hhmmToMinutes, minutesToHHMM, dateKey } from "./dates";

export interface Reminder {
  id: string;
  time: string; // HH:MM
  title: string;
  body: string;
  kind: "posture" | "hyoid" | "skin" | "water";
  tab: "dashboard" | "posture" | "routine";
}

export function buildSchedule(r: ReminderSettings): Reminder[] {
  const out: Reminder[] = [];
  if (r.posture) {
    const a = hhmmToMinutes(r.wakeStart);
    const b = hhmmToMinutes(r.wakeEnd);
    for (let m = a + r.postureEveryMin; m <= b; m += r.postureEveryMin) {
      out.push({ id: `posture-${minutesToHHMM(m)}`, time: minutesToHHMM(m), kind: "posture", tab: "dashboard", title: "Posture check", body: "Press your full tongue to the palate, lips sealed, ears over shoulders." });
    }
  }
  if (r.hyoid) {
    out.push({ id: "hyoid-am", time: r.hyoidAM, kind: "hyoid", tab: "posture", title: "Hyoid exercise time", body: "Morning session: swallow-and-hold raises and tongue presses." });
    out.push({ id: "hyoid-pm", time: r.hyoidPM, kind: "hyoid", tab: "posture", title: "Hyoid exercise time", body: "Evening session: chin tucks, neck flexor curls and tongue stretches." });
  }
  if (r.skin) {
    out.push({ id: "skin-am", time: r.skinAM, kind: "skin", tab: "routine", title: "Skincare and hydration", body: "Cleanse, moisturise, SPF. Drink a glass of water." });
    out.push({ id: "skin-pm", time: r.skinPM, kind: "skin", tab: "routine", title: "Night skincare", body: "Cleanse and moisturise. Wind down for 7+ hours of sleep." });
  }
  if (r.water) {
    const a = hhmmToMinutes(r.wakeStart);
    const b = hhmmToMinutes(r.wakeEnd);
    for (let m = a + r.waterEveryMin; m <= b; m += r.waterEveryMin) {
      out.push({ id: `water-${minutesToHHMM(m)}`, time: minutesToHHMM(m), kind: "water", tab: "routine", title: "Hydration", body: "Drink a glass of water (about 250 ml)." });
    }
  }
  return out.sort((x, y) => hhmmToMinutes(x.time) - hhmmToMinutes(y.time));
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const prod = process.env.NODE_ENV === "production";
    return await navigator.serviceWorker.register(`${BASE}/sw.js${prod ? "?cache=1" : ""}`);
  } catch {
    return null;
  }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

export async function showNotification(title: string, body: string, tag: string, tab = "dashboard"): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = (await ensureServiceWorker()) ?? (await navigator.serviceWorker?.getRegistration());
    const opts: NotificationOptions = { body, tag, icon: `${BASE}/icons/icon-192.png`, badge: `${BASE}/icons/icon-192.png`, data: { tab } };
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
    return true;
  } catch {
    try { new Notification(title, { body, tag }); return true; } catch { return false; }
  }
}

const firedKey = (d: string) => `lb:fired:${d}`;

/** Fire any reminder that came due in the last `graceMin` minutes and has not fired today. */
export function dueReminders(schedule: Reminder[], now = new Date(), graceMin = 20): Reminder[] {
  const key = dateKey(now);
  let fired: string[] = [];
  try { fired = JSON.parse(localStorage.getItem(firedKey(key)) ?? "[]"); } catch { /* ignore */ }
  const mins = now.getHours() * 60 + now.getMinutes();
  return schedule.filter((r) => {
    const t = hhmmToMinutes(r.time);
    return t <= mins && mins - t <= graceMin && !fired.includes(r.id);
  });
}

export function markFired(ids: string[], now = new Date()) {
  const key = dateKey(now);
  try {
    const cur: string[] = JSON.parse(localStorage.getItem(firedKey(key)) ?? "[]");
    localStorage.setItem(firedKey(key), JSON.stringify([...new Set([...cur, ...ids])]));
    // prune old days
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("lb:fired:") && k !== firedKey(key)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

/** Calendar file with daily recurring reminders. Works when the app is closed and across devices. */
export function buildICS(schedule: Reminder[], startDate: string, days = 60): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const [y, m, d] = startDate.split("-");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Looksbitching//60 Day Glow-Up//EN", "CALSCALE:GREGORIAN"];
  for (const r of schedule) {
    const [hh, mm] = r.time.split(":");
    const end = minutesToHHMM(hhmmToMinutes(r.time) + 10).replace(":", "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.id}-${startDate}@looksbitching`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${y}${m}${d}T${hh}${mm}00`,
      `DTEND:${y}${m}${d}T${end}00`,
      `RRULE:FREQ=DAILY;COUNT=${days}`,
      `SUMMARY:${r.title}`,
      `DESCRIPTION:${r.body}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${r.title}`, "TRIGGER:PT0M", "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export const describeTime = fmtTime;
