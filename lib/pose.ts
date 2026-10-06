import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseFront, PoseSide } from "./types";
import { BASE } from "./base";

let pending: Promise<PoseLandmarker> | null = null;

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!pending) {
    pending = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(`${BASE}/mediapipe`);
      const make = (delegate: "GPU" | "CPU") =>
        PoseLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: `${BASE}/models/pose_landmarker_lite.task`, delegate }, runningMode: "IMAGE", numPoses: 1 });
      try { return await make("GPU"); } catch { return await make("CPU"); }
    })();
    pending.catch(() => { pending = null; });
  }
  return pending;
}

export class NoBodyError extends Error {}

const deg = (r: number) => (r * 180) / Math.PI;
type P = { x: number; y: number; visibility?: number };

async function detect(img: HTMLImageElement) {
  const lmk = await getPoseLandmarker();
  const res = lmk.detect(img);
  if (!res.landmarks?.length) throw new NoBodyError("No body found");
  const raw = res.landmarks[0] as P[];
  const w = img.naturalWidth, h = img.naturalHeight;
  const px = (i: number) => ({ x: raw[i].x * w, y: raw[i].y * h });
  const keep: Record<string, [number, number]> = {};
  for (const i of [0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) keep[i] = [Math.round(raw[i].x * 10000) / 10000, Math.round(raw[i].y * 10000) / 10000];
  return { px, keep, raw };
}

/** Front full-body photo: level shoulders/hips, proportions. */
export async function analyzePoseFront(img: HTMLImageElement): Promise<PoseFront> {
  const { px, keep } = await detect(img);
  const tilt = (a: number, b: number) => { const A = px(a), B = px(b); return deg(Math.atan2(B.y - A.y, B.x - A.x)); };
  const d = (a: number, b: number) => Math.hypot(px(a).x - px(b).x, px(a).y - px(b).y);
  const mid = (a: number, b: number) => ({ x: (px(a).x + px(b).x) / 2, y: (px(a).y + px(b).y) / 2 });
  const sh = mid(11, 12), hp = mid(23, 24), an = mid(27, 28);
  const torso = Math.hypot(sh.x - hp.x, sh.y - hp.y), leg = Math.hypot(hp.x - an.x, hp.y - an.y);
  return {
    shoulderTiltDeg: Math.round(tilt(12, 11) * 10) / 10,
    hipTiltDeg: Math.round(tilt(24, 23) * 10) / 10,
    headTiltDeg: Math.round(tilt(8, 7) * 10) / 10,
    shoulderHipRatio: Math.round((d(11, 12) / d(23, 24)) * 100) / 100,
    legRatio: Math.round((leg / (leg + torso)) * 1000) / 1000,
    pts: keep,
  };
}

/** Side full-body photo: ear over shoulder over hip. */
export async function analyzePoseSide(img: HTMLImageElement): Promise<PoseSide> {
  const { px, keep, raw } = await detect(img);
  // use the camera-facing side: the one with higher landmark visibility
  const visL = (raw[7].visibility ?? 0) + (raw[11].visibility ?? 0) + (raw[23].visibility ?? 0);
  const visR = (raw[8].visibility ?? 0) + (raw[12].visibility ?? 0) + (raw[24].visibility ?? 0);
  const [ear, sh, hp] = visL >= visR ? [7, 11, 23] : [8, 12, 24];
  const nose = px(0), E = px(ear), S = px(sh), H = px(hp);
  const facing: 1 | -1 = nose.x >= E.x ? 1 : -1;
  const torso = Math.hypot(S.x - H.x, S.y - H.y) || 1;
  return {
    headFwd: Math.round(((E.x - S.x) * facing / torso) * 1000) / 1000,
    shoulderFwd: Math.round(((S.x - H.x) * facing / torso) * 1000) / 1000,
    facing, pts: keep,
  };
}
