"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./ui";
import { PostureCompare } from "./Demo";

/** Downscale to <=1024px JPEG so IndexedDB stays small. */
export function fileToDataUrl(file: File | Blob, max = 1024): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Could not read that image")); };
    img.src = url;
  });
}

export type CapKind = "front" | "side" | "bodyFront" | "bodySide";

export function Guide({ kind }: { kind: CapKind }) {
  return (
    <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {kind === "bodyFront" || kind === "bodySide" ? (
        <g fill="none" stroke="rgba(196,181,253,.85)" strokeWidth="2" strokeDasharray="7 6">
          <circle cx="150" cy="50" r="22" />
          {kind === "bodyFront" ? <path d="M150 74 L150 220 M92 100 Q150 86 208 100 L216 190 M92 100 L84 190 M120 220 L112 380 M180 220 L188 380 M150 220 L150 380" /> : <path d="M150 74 L150 220 M150 100 L156 190 M150 220 L152 380 M150 100 Q132 130 150 220" />}
          <path d="M70 392 H230" stroke="rgba(110,231,183,.45)" strokeDasharray="3 6" />
        </g>
      ) : kind === "front" ? (
        <g fill="none" stroke="rgba(196,181,253,.85)" strokeWidth="2" strokeDasharray="7 6">
          <ellipse cx="150" cy="165" rx="82" ry="108" />
          <path d="M150 55V275M70 150H230" stroke="rgba(110,231,183,.45)" strokeDasharray="3 6" />
          <path d="M70 330q80-40 160 0" />
        </g>
      ) : (
        <g fill="none" stroke="rgba(196,181,253,.85)" strokeWidth="2" strokeDasharray="7 6">
          <path d="M175 58c-45 0-72 34-72 78 0 20 4 33 10 46l-12 12 12 8-4 14 10 8-4 24c0 14 12 22 28 22h40" />
          <path d="M175 58c30 0 52 22 52 60v110" />
          <path d="M60 260H250" stroke="rgba(110,231,183,.45)" strokeDasharray="3 6" />
          <circle cx="198" cy="150" r="5" stroke="rgba(110,231,183,.8)" strokeDasharray="0" />
        </g>
      )}
    </svg>
  );
}

export function Capture({ kind, onCapture }: { kind: CapKind; onCapture: (dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");
  const [count, setCount] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const stop = useCallback(() => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setOn(false); }, []);
  useEffect(() => stop, [stop]);

  const start = async (f = facing) => {
    setErr("");
    stop();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: f, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      stream.current = s;
      if (video.current) { video.current.srcObject = s; await video.current.play(); }
      setOn(true);
    } catch {
      setErr("Camera unavailable or blocked. Allow camera access, or upload a photo instead.");
    }
  };

  const snap = useCallback(() => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const k = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    onCapture(c.toDataURL("image/jpeg", 0.9));
    stop();
  }, [onCapture, stop]);

  const timer = (n = 5) => {
    setCount(n);
    let c = n;
    const i = setInterval(() => { c--; setCount(c); if (c <= 0) { clearInterval(i); snap(); } }, 1000);
  };

  return (
    <div className="grid gap-3">
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-black" style={{ aspectRatio: kind.startsWith("body") ? "2 / 3" : "3 / 4" }}>
        <video ref={video} playsInline muted className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${on ? "" : "hidden"}`} />
        {!on && (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-ink-2">
            <div className="grid gap-2"><Icon name="camera" size={34} className="mx-auto text-vio-3" /><b className="text-ink">{{ front: "Front photo", side: "Side profile photo", bodyFront: "Full-body front", bodySide: "Full-body side" }[kind]}</b>
              <span>{{ front: "Face the lens, chin level, neutral expression, hair off the forehead, soft light from in front.", side: "Turn 90° so one ear faces the camera. Relaxed stance, look straight ahead, neck and shoulder line visible. Include the base of the neck.", bodyFront: "Stand 2–3 m back, arms relaxed at your sides, feet hip-width, whole body in frame, fitted clothing.", bodySide: "Turn 90°, arms relaxed, stand naturally (do not correct your posture), whole body in frame." }[kind]}</span></div>
          </div>
        )}
        <Guide kind={kind} />
        {count > 0 && <div className="absolute inset-0 grid place-items-center bg-black/30 font-display text-8xl font-extrabold">{count}</div>}
      </div>
      {err && <p className="text-center text-sm text-bad">{err}</p>}
      <details open className="glass-flat mx-auto w-full max-w-sm p-3 text-sm">
        <summary className="cursor-pointer font-bold">How to get a good {kind} photo</summary>
        <ul className="mt-2 grid gap-1.5 text-ink-2">
          {(kind === "front" || kind === "bodyFront"
            ? kind === "bodyFront" ? ["Camera at hip height, 2–3 m away, phone upright", "Fitted clothes so the shoulders and waist show", "Stand relaxed, weight even on both feet", "Whole body in frame including shoes"] : ["Face a window or lamp so light hits your whole face evenly", "Camera at eye level, about an arm's length away", "Chin level, relaxed mouth, hair off the forehead", "Same spot every time, no filters or beauty mode"]
            : kind === "bodySide" ? ["Turn 90° and stand naturally, don't correct your posture", "Arms relaxed at your sides", "Camera at hip height, whole body in frame", "A natural stand shows your real habit"] : ["Turn 90° so one ear faces the camera", "Stand or sit tall, look straight ahead, shoulders relaxed", "Keep the base of the neck and shoulder in frame", "Use the 5 s timer and prop the phone at head height"]
          ).map((t) => <li key={t} className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 shrink-0 text-emr-2" />{t}</li>)}
        </ul>
        {kind === "side" && <div className="mt-3"><PostureCompare /></div>}
      </details>
      <div className="flex flex-wrap justify-center gap-2">
        {!on ? <button className="btn btn-vio" onClick={() => start()}><Icon name="camera" size={18} /> Open camera</button> : (
          <>
            <button className="btn btn-vio" onClick={snap}><Icon name="camera" size={18} /> Capture</button>
            <button className="btn" onClick={() => timer(5)}>5 s timer</button>
            <button className="btn" onClick={() => { const f = facing === "user" ? "environment" : "user"; setFacing(f); start(f); }}><Icon name="swap" size={18} /> Flip</button>
          </>
        )}
        <button className="btn" onClick={() => file.current?.click()}><Icon name="upload" size={18} /> Upload</button>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { stop(); onCapture(await fileToDataUrl(f)); } e.target.value = ""; }} />
      </div>
    </div>
  );
}
