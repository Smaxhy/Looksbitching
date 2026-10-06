import type { CategoryResult, FrontMetrics, Measures, ScanResult, SelfAssessment, GlowAction } from "./types";
import { getLandmarker } from "./landmarker";

type Pt = { x: number; y: number };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const r1 = (v: number) => Math.round(v * 10) / 10;
const deg = (r: number) => (r * 180) / Math.PI;

export class NoFaceError extends Error {}

// ───────────────────────── front photo → metrics ─────────────────────────

export async function analyzeFront(img: HTMLImageElement | HTMLCanvasElement): Promise<FrontMetrics> {
  const lmk = await getLandmarker();
  const res = lmk.detect(img);
  if (!res.faceLandmarks?.length) throw new NoFaceError("No face found");
  const w = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const h = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  const raw = res.faceLandmarks[0];
  const P = (i: number): Pt => ({ x: raw[i].x * w, y: raw[i].y * h }); // pixel space

  // Crop to the face and normalise size so texture numbers do not depend on photo resolution.
  const xs = raw.map((p) => p.x * w), ys = raw.map((p) => p.y * h);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const padX = (maxX - minX) * 0.12, padY = (maxY - minY) * 0.12;
  const cx0 = Math.max(0, minX - padX), cy0 = Math.max(0, minY - padY);
  const cw = Math.min(w - cx0, maxX - minX + padX * 2), ch = Math.min(h - cy0, maxY - minY + padY * 2);
  const S = 480 / cw;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw * S);
  canvas.height = Math.round(ch * S);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, cx0, cy0, cw, ch, 0, 0, canvas.width, canvas.height);
  const Q = (i: number): Pt => ({ x: (P(i).x - cx0) * S, y: (P(i).y - cy0) * S }); // crop space
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const lum = (x: number, y: number) => {
    const xi = clamp(Math.round(x), 0, data.width - 1), yi = clamp(Math.round(y), 0, data.height - 1);
    const o = (yi * data.width + xi) * 4;
    return 0.2126 * data.data[o] + 0.7152 * data.data[o + 1] + 0.0722 * data.data[o + 2];
  };
  const patch = (c: Pt, rw: number, rh: number) => {
    let L = 0, R = 0, G = 0, n = 0, lap = 0, ln = 0;
    for (let y = Math.round(c.y - rh / 2); y <= c.y + rh / 2; y += 1) {
      for (let x = Math.round(c.x - rw / 2); x <= c.x + rw / 2; x += 1) {
        if (x < 1 || y < 1 || x >= data.width - 1 || y >= data.height - 1) continue;
        const o = (y * data.width + x) * 4;
        R += data.data[o]; G += data.data[o + 1];
        const l = lum(x, y);
        L += l; n++;
        lap += Math.abs(4 * l - lum(x - 1, y) - lum(x + 1, y) - lum(x, y - 1) - lum(x, y + 1));
        ln++;
      }
    }
    n = Math.max(n, 1);
    return { L: L / n, R: R / n, G: G / n, lap: lap / Math.max(ln, 1) };
  };

  // ── pose ──
  const eyeR = P(33), eyeL = P(263);
  let roll = deg(Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x));
  let yaw = 0, pitch = 0;
  const m = res.facialTransformationMatrixes?.[0]?.data;
  if (m && m.length >= 16) {
    const col = (c: number) => { const v = [m[c * 4], m[c * 4 + 1], m[c * 4 + 2]]; const n = Math.hypot(v[0], v[1], v[2]) || 1; return v.map((q) => q / n); };
    const c0 = col(0), c1 = col(1), c2 = col(2);
    // R[row][col]
    yaw = deg(Math.atan2(c2[0], c2[2]));
    pitch = deg(Math.asin(clamp(-c2[1], -1, 1)));
    const r = deg(Math.atan2(c0[1], c1[1]));
    if (Number.isFinite(r) && Math.abs(r) < 60) roll = r;
  }

  // ── symmetry about a fitted midline (crop space) ──
  const mid = [10, 168, 1, 2, 152].map(Q);
  const mx = mid.reduce((a, p) => a + p.x, 0) / mid.length, my = mid.reduce((a, p) => a + p.y, 0) / mid.length;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of mid) { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) ** 2; }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); // principal axis angle
  const ax = Math.cos(th), ay = Math.sin(th);
  const ux = ay >= 0 ? ax : -ax, uy = ay >= 0 ? ay : -ay; // unit vector pointing "down" the face
  const nx = -uy, ny = ux; // normal
  const faceW = dist(Q(234), Q(454));
  const pairs: [number, number][] = [[33, 263], [133, 362], [61, 291], [70, 300], [105, 334], [46, 276], [93, 323], [132, 361], [58, 288], [172, 397], [136, 365], [150, 379], [149, 378], [176, 400], [127, 356], [129, 358]];
  let asym = 0;
  for (const [a, b] of pairs) {
    const pa = Q(a), pb = Q(b);
    const da = (pa.x - mx) * nx + (pa.y - my) * ny, db = (pb.x - mx) * nx + (pb.y - my) * ny;
    const ha = (pa.x - mx) * ux + (pa.y - my) * uy, hb = (pb.x - mx) * ux + (pb.y - my) * uy;
    const horiz = Math.abs(Math.abs(da) - Math.abs(db)); // distance from midline mismatch
    const vert = Math.abs(ha - hb); // height mismatch
    asym += (horiz + vert) / faceW;
  }
  asym /= pairs.length;

  // ── jaw ──
  const bigonial = dist(Q(172), Q(397)), bizyg = faceW;
  const ang = (c: Pt, a: Pt, b: Pt) => {
    const v1 = { x: a.x - c.x, y: a.y - c.y }, v2 = { x: b.x - c.x, y: b.y - c.y };
    return deg(Math.acos(clamp((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1), -1, 1)));
  };
  const gonial = (ang(Q(172), Q(58), Q(152)) + ang(Q(397), Q(288), Q(152))) / 2;
  // luminance step across the jawline: just inside the face vs just below (neck shadow / background)
  const contour = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397];
  const cen = Q(168);
  let edge = 0, ec = 0;
  for (const i of contour) {
    const p = Q(i);
    const dx = p.x - cen.x, dy = p.y - cen.y, len = Math.hypot(dx, dy) || 1;
    const off = faceW * 0.035;
    const inside = { x: p.x - (dx / len) * off, y: p.y - (dy / len) * off };
    const outside = { x: p.x + (dx / len) * off, y: p.y + (dy / len) * off };
    edge += Math.abs(lum(inside.x, inside.y) - lum(outside.x, outside.y)) / 255;
    ec++;
  }
  edge /= ec;

  // ── skin ──
  const faceH = dist(Q(10), Q(152));
  const rw = faceW * 0.14, rh = faceW * 0.1;
  const cheekR = patch(Q(50), rw, rh), cheekL = patch(Q(280), rw, rh);
  const eyeLidR = Q(145), eyeLidL = Q(374);
  const underR = patch({ x: eyeLidR.x, y: eyeLidR.y + faceH * 0.06 }, rw * 0.8, faceH * 0.04);
  const underL = patch({ x: eyeLidL.x, y: eyeLidL.y + faceH * 0.06 }, rw * 0.8, faceH * 0.04);
  const forehead = patch({ x: (Q(9).x + Q(10).x) / 2, y: (Q(9).y + Q(10).y) / 2 }, rw * 1.5, rh);
  const cheekL_ = (cheekR.L + cheekL.L) / 2;
  const underL_ = (underR.L + underL.L) / 2;
  const dark = clamp((cheekL_ - underL_) / Math.max(cheekL_, 1), -0.2, 0.6);
  const texture = (cheekR.lap + cheekL.lap) / 2;
  const redC = ((cheekR.R - cheekR.G) / (cheekR.R + cheekR.G + 1) + (cheekL.R - cheekL.G) / (cheekL.R + cheekL.G + 1)) / 2;
  const redF = (forehead.R - forehead.G) / (forehead.R + forehead.G + 1);
  const brightness = (cheekR.L + cheekL.L + forehead.L) / 3;

  const thirdsTotal = dist(Q(10), Q(9)) + dist(Q(9), Q(2)) + dist(Q(2), Q(152));
  const thirds: [number, number, number] = [dist(Q(10), Q(9)) / thirdsTotal, dist(Q(9), Q(2)) / thirdsTotal, dist(Q(2), Q(152)) / thirdsTotal];

  return {
    rollDeg: r1(roll), yawDeg: r1(yaw), pitchDeg: r1(pitch),
    asymmetry: Math.round(asym * 1000) / 1000,
    bigonialRatio: Math.round((bigonial / bizyg) * 100) / 100,
    gonialAngleDeg: Math.round(gonial),
    jawEdgeContrast: Math.round(edge * 1000) / 1000,
    darkCircle: Math.round(dark * 1000) / 1000,
    texture: r1(texture),
    redness: Math.round((redC - redF) * 1000) / 1000,
    brightness: Math.round(brightness),
    thirds,
    faceRatio: Math.round((faceH / faceW) * 100) / 100,
    quality: { yawOk: Math.abs(yaw) <= 8, rollOk: Math.abs(roll) <= 4, pitchOk: Math.abs(pitch) <= 10, bright: brightness >= 70 && brightness <= 205 },
  };
}

// ───────────────────────── profile-photo measurements ─────────────────────────

/** Angle ABC at B in degrees, 0..180. */
export function angleAt(a: Pt, b: Pt, c: Pt): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
  return deg(Math.acos(clamp((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1), -1, 1)));
}

/** Craniovertebral angle: line C7→tragus against the horizontal through C7. Facing direction does not matter. */
export function craniovertebralAngle(c7: Pt, tragus: Pt): number {
  return deg(Math.atan2(Math.abs(c7.y - tragus.y), Math.abs(tragus.x - c7.x) || 1e-6));
}

// ───────────────────────── scoring ─────────────────────────

export interface ScoreContext {
  waterRatio7d: number; // 0..1 average of last 7 logged days
  sleepAvg7d: number | null;
}

export const DEFAULT_SELF: SelfAssessment = {
  submentalFullness: 3, skinTight: false, skinFlaky: false, skinOily: false, acne: 0,
  norwood: 1, hairCondition: 3, brows: 3, facialHair: 3, teeth: 3,
};

const NORWOOD_SCORE = [0, 10, 9, 7.5, 6, 4.5, 3.5, 3];
const FULLNESS_SCORE = [0, 9.5, 8, 6.5, 4.5, 3];

function weighted(parts: { v: number; w: number }[]): number {
  const tw = parts.reduce((a, p) => a + p.w, 0);
  return clamp(parts.reduce((a, p) => a + p.v * p.w, 0) / tw, 1, 10);
}

export function scoreCmA(cma: number): number {
  const off = cma < 105 ? 105 - cma : cma > 120 ? cma - 120 : 0;
  return clamp(10 - off * 0.14, 2, 10);
}
export function scoreCva(cva: number): number {
  if (cva >= 55) return 10;
  return clamp(10 - (55 - cva) * 0.35, 2, 10);
}

export function buildResult(args: {
  id: string; dateKey: string; day: number; frontId?: string; sideId?: string;
  front?: FrontMetrics; measures: Measures; self: SelfAssessment; ctx: ScoreContext;
}): ScanResult {
  const { front: f, measures: m, self: s, ctx } = args;
  const cats: CategoryResult[] = [];

  // Jawline & submental
  {
    const parts: { v: number; w: number }[] = [{ v: FULLNESS_SCORE[s.submentalFullness], w: 0.25 }];
    const basis: string[] = [`Self-rated submental fullness ${s.submentalFullness}/5 (25%).`];
    const details: string[] = [];
    let conf: CategoryResult["confidence"] = "low";
    if (m.cmaDeg != null) {
      const sc = scoreCmA(m.cmaDeg);
      parts.push({ v: sc, w: 0.45 });
      basis.push(`Cervicomental angle ${Math.round(m.cmaDeg)}° vs 105–120° benchmark (45%).`);
      details.push(m.cmaDeg > 120 ? `Chin–neck angle is ${Math.round(m.cmaDeg)}°, wider than the 105–120° benchmark. The usual drivers are submental fat, a head-forward posture and a recessed chin.` : m.cmaDeg < 105 ? `Chin–neck angle is ${Math.round(m.cmaDeg)}°, sharper than the benchmark, which is typically a good sign. Check the tool points if it seems too low.` : `Chin–neck angle is ${Math.round(m.cmaDeg)}°, inside the 105–120° benchmark.`);
      conf = "medium";
    } else details.push("Measure the cervicomental angle on your side photo to unlock the most informative jaw metric.");
    if (f) {
      const ecScore = 3 + clamp(f.jawEdgeContrast / 0.12, 0, 1) * 6.5;
      parts.push({ v: ecScore, w: 0.3 });
      basis.push(`Jawline edge contrast ${(f.jawEdgeContrast * 100).toFixed(1)}% of full brightness (30%). Depends on lighting.`);
      details.push(`Visible jaw edge is ${f.jawEdgeContrast > 0.09 ? "crisp" : f.jawEdgeContrast > 0.05 ? "moderate" : "soft"} in this light. Jaw width is ${Math.round(f.bigonialRatio * 100)}% of cheekbone width.`);
      if (m.cmaDeg != null && f.quality.yawOk && f.quality.pitchOk) conf = "high";
    }
    if (s.submentalFullness >= 4) details.push("You rated the area under the chin as full. Overall fat loss is the lever. Exercise cannot spot-reduce it.");
    const score = weighted(parts);
    cats.push({ key: "jaw", label: "Jawline & submental", score: r1(score), confidence: conf, headline: score >= 8 ? "Defined and well-balanced" : score >= 6 ? "Decent definition with room to sharpen" : "Soft definition. Biggest upside is here", details, basis });
  }

  // Symmetry, tilt & posture
  {
    const parts: { v: number; w: number }[] = [];
    const basis: string[] = [];
    const details: string[] = [];
    let conf: CategoryResult["confidence"] = "low";
    if (f) {
      const sym = clamp(10 - Math.max(0, f.asymmetry - 0.008) * 100, 2, 10);
      const tilt = clamp(10 - Math.abs(f.rollDeg) * 0.8 - Math.max(0, Math.abs(f.pitchDeg) - 4) * 0.25, 2, 10);
      parts.push({ v: sym, w: 0.5 }, { v: tilt, w: 0.2 });
      basis.push(`Landmark mismatch ${(f.asymmetry * 100).toFixed(1)}% of face width (50%).`, `Head roll ${f.rollDeg}°, pitch ${f.pitchDeg}° (20%).`);
      details.push(`Left–right landmark mismatch is ${(f.asymmetry * 100).toFixed(1)}% of face width. Anything under about 3% is within the normal range.`);
      if (Math.abs(f.rollDeg) > 3) details.push(`Your head is tilted about ${Math.abs(f.rollDeg).toFixed(1)}° ${f.rollDeg > 0 ? "clockwise" : "counter-clockwise"} in the frame. Tilt makes the face look more asymmetric.`);
      if (Math.abs(f.yawDeg) > 8) details.push(`The face is rotated ${Math.abs(f.yawDeg).toFixed(0)}° away from the camera, which inflates asymmetry. Retake looking straight at the lens.`);
      conf = f.quality.yawOk && f.quality.rollOk ? "medium" : "low";
    }
    if (m.cvaDeg != null) {
      parts.push({ v: scoreCva(m.cvaDeg), w: 0.3 });
      basis.push(`Craniovertebral angle ${Math.round(m.cvaDeg)}° vs ~50°+ typical (30%).`);
      details.push(m.cvaDeg >= 50 ? `Craniovertebral angle is ${Math.round(m.cvaDeg)}°, so your head sits reasonably over your shoulders.` : `Craniovertebral angle is ${Math.round(m.cvaDeg)}°, which indicates forward-head posture. This is the part of the programme with the best evidence.`);
    } else details.push("Add your CVA from the side photo to include posture in this score.");
    const score = parts.length ? weighted(parts) : 5;
    cats.push({ key: "symmetry", label: "Symmetry & posture", score: r1(score), confidence: parts.length ? conf : "low", headline: score >= 8 ? "Balanced and well-aligned" : score >= 6 ? "Mostly aligned, with small differences" : "Noticeable tilt or forward-head posture", details, basis });
  }

  // Skin
  {
    const parts: { v: number; w: number }[] = [];
    const basis: string[] = [];
    const details: string[] = [];
    let conf: CategoryResult["confidence"] = "low";
    if (f) {
      const tex = clamp(10 - (f.texture - 1.5) * 0.9, 3, 10);
      const dk = clamp(10 - Math.max(0, f.darkCircle - 0.04) * 30, 3.5, 10);
      const red = clamp(10 - Math.max(0, f.redness - 0.01) * 50, 4, 10);
      parts.push({ v: tex, w: 0.3 }, { v: dk, w: 0.25 });
      parts.push({ v: (red + [10, 8, 6, 4][s.acne]) / 2, w: 0.2 });
      basis.push(`Cheek texture index ${f.texture} (30%).`, `Under-eye darkness ${(f.darkCircle * 100).toFixed(0)}% darker than cheek (25%).`, `Redness vs forehead ${(f.redness * 1000).toFixed(0)}‰ and self-rated acne ${s.acne}/3 (20%).`);
      details.push(f.darkCircle > 0.12 ? `Under-eyes read about ${(f.darkCircle * 100).toFixed(0)}% darker than your cheeks. Sleep, hydration and shadow from overhead light all contribute, and some of it is structural or genetic.` : "Under-eye area is close to the tone of your cheeks.");
      details.push(f.texture > 5.5 ? "Skin texture reads rough in the photo. This can be real texture or just a sharp, close-up image, so compare future scans taken the same way." : "Skin texture reads smooth at this scale.");
      if (!f.quality.bright) details.push(`Lighting is ${f.brightness < 70 ? "too dark" : "too bright"}, which lowers confidence. Use soft daylight facing a window.`);
      conf = f.quality.bright && f.quality.yawOk ? "medium" : "low";
    }
    let hyd = 8.5 - (s.skinTight ? 1.5 : 0) - (s.skinFlaky ? 1.5 : 0) + (ctx.waterRatio7d - 0.7) * 2;
    if (ctx.sleepAvg7d != null) hyd += clamp((ctx.sleepAvg7d - 7) * 0.3, -1, 0.5);
    hyd = clamp(hyd, 3, 10);
    parts.push({ v: hyd, w: 0.25 });
    basis.push(`Hydration estimate from tightness/flaking, your 7-day water average (${Math.round(ctx.waterRatio7d * 100)}% of target) and sleep (25%). A camera cannot measure hydration.`);
    if (s.skinTight || s.skinFlaky) details.push("You reported tightness or flaking, which points to a compromised skin barrier. Simplify the routine and moisturise.");
    const score = weighted(parts);
    cats.push({ key: "skin", label: "Skin, hydration & eyes", score: r1(score), confidence: conf, headline: score >= 8 ? "Clear and healthy-looking" : score >= 6 ? "Good base. Hydration and barrier are the levers" : "Skin needs a consistent routine", details, basis });
  }

  // Hairline & grooming (self-assessed + facial thirds)
  {
    const parts = [
      { v: NORWOOD_SCORE[s.norwood], w: 0.3 }, { v: s.hairCondition * 2, w: 0.2 },
      { v: s.brows * 2, w: 0.15 }, { v: s.facialHair * 2, w: 0.15 }, { v: s.teeth * 2, w: 0.2 },
    ];
    const details: string[] = [];
    details.push(s.norwood >= 3 ? `Hairline self-rated Norwood ${s.norwood}. Recession is where evidence-based treatment matters most, and earlier is better.` : "Hairline looks intact on your self-rating.");
    if (s.hairCondition <= 2) details.push("Hair condition is low. Cut back on heat, use a conditioner and keep a regular trim.");
    if (s.brows <= 2) details.push("Clean up the brows by tidying strays only. Keep the natural shape.");
    if (s.facialHair <= 2) details.push("Keep facial hair intentional: either a clean shave or a defined, regularly trimmed beard line.");
    if (f) details.push(`Facial thirds (hairline-top → brow → nose base → chin): ${f.thirds.map((t) => Math.round(t * 100)).join(" / ")}%. Equal thirds is a classical guide only. Hair over the forehead makes the top third unreliable.`);
    const score = weighted(parts);
    cats.push({ key: "grooming", label: "Hairline & grooming", score: r1(score), confidence: "low", headline: score >= 8 ? "Sharp and well-kept" : score >= 6 ? "Solid with a few easy upgrades" : "Grooming is a quick win", details, basis: ["Self-assessed, because hairline and grooming cannot be judged reliably from landmarks.", "Weights: hairline 30%, hair 20%, teeth 20%, brows 15%, facial hair 15%."] });
  }

  const overall = r1(cats.reduce((a, c) => a + c.score, 0) / cats.length);
  let faceShape: string | undefined;
  if (f) {
    faceShape = f.bigonialRatio < 0.68 ? "Heart / tapered" : f.faceRatio > 1.45 ? "Long / oblong" : f.faceRatio < 1.28 ? (f.bigonialRatio >= 0.78 ? "Square" : "Round") : "Oval";
  }
  return { id: args.id, ts: Date.now(), dateKey: args.dateKey, day: args.day, frontId: args.frontId, sideId: args.sideId, front: f, measures: m, self: s, categories: cats, overall, faceShape };
}

// ───────────────────────── glow-up action list ─────────────────────────

export function buildActions(r: ScanResult, ctx: ScoreContext): GlowAction[] {
  const A: GlowAction[] = [];
  const sc = (k: string) => r.categories.find((c) => c.key === k)!.score;
  const m = r.measures, s = r.self, f = r.front;

  if ((m.cmaDeg != null && m.cmaDeg > 120) || s.submentalFullness >= 4 || sc("jaw") < 6.5) {
    A.push({ id: "fat", title: "Lower body fat gradually", category: "jaw", priority: 1, studyIds: ["vispute2011", "coetzee2009"],
      why: "Submental fullness is mostly fat, and fat cannot be removed from one spot by exercising that spot.",
      how: ["Aim for a moderate deficit, about 300–500 kcal/day, for roughly 0.25–0.5 kg per week.", "Eat 1.6–2.2 g protein per kg and lift weights 2–3 times a week to keep muscle.", "Weigh in weekly (Routine tab) and compare scans every 2–4 weeks, not daily."] });
  }
  if ((m.cvaDeg != null && m.cvaDeg < 50) || sc("symmetry") < 7) {
    A.push({ id: "neck", title: "Correct forward-head posture", category: "symmetry", priority: 1, studyIds: ["falla2007", "jull2002", "yip2008"],
      why: "A head that sits forward deepens the chin–neck angle and shortens the visible jawline. Deep neck flexor training is the best-evidenced fix.",
      how: ["Do the evening chin tuck and neck flexor curl sessions every day.", "Raise your screen so the top is at eye level and keep your phone up near eye height.", "Use the 2-hourly posture check, and stand or walk for 2 minutes every 30–45 minutes."] });
  }
  if (f && (Math.abs(f.rollDeg) > 3 || Math.abs(f.yawDeg) > 8 || Math.abs(f.pitchDeg) > 10)) {
    A.push({ id: "retake", title: "Retake the front photo", category: "symmetry", priority: 3, studyIds: ["rhodes2006"],
      why: "Your head was turned or tilted, which inflates asymmetry and lowers the accuracy of every metric.",
      how: ["Camera at eye level on a stable surface or tripod, arm's length away.", "Look straight into the lens, chin level, neutral expression, hair off the face.", "Use soft light from a window in front of you."] });
  }
  if (sc("skin") < 8 || ctx.waterRatio7d < 0.8) {
    A.push({ id: "hydrate", title: `Hit ${(2500 / 1000).toFixed(1)} L of water most days`, category: "skin", priority: ctx.waterRatio7d < 0.6 ? 1 : 2, studyIds: ["palma2015"],
      why: "Extra water raised skin hydration in people who were under-drinking. The benefit is smaller if you already drink enough.",
      how: [`Your last 7 days averaged ${Math.round(ctx.waterRatio7d * 100)}% of your water target.`, "Drink a glass on waking, with each meal, and mid-afternoon. Tap the water counter in Routine.", "Pale-yellow urine is a good practical check."] });
  }
  A.push({ id: "spf", title: "Wear SPF 30+ every morning", category: "skin", priority: 1, studyIds: ["hughes2013"],
    why: "In a 4.5-year trial, daily sunscreen users showed about 24% less skin ageing than people who used it occasionally.",
    how: ["Use two finger-lengths for face and neck.", "Reapply after 2 hours of direct sun.", "It is already in your AM skincare checklist."] });
  if (sc("skin") < 7.5 || s.skinTight || s.skinFlaky) {
    A.push({ id: "barrier", title: "Repair the skin barrier", category: "skin", priority: s.skinTight || s.skinFlaky ? 1 : 2, studyIds: ["kafi2007", "oyetakin2015"],
      why: "Tightness, flaking and redness usually mean an over-stripped barrier. Repair first, then add actives.",
      how: ["Switch to a gentle non-foaming cleanser and a ceramide moisturiser.", "Pause exfoliating acids for 2 weeks.", "Then add a retinoid slowly (2 nights/week) once skin is calm. Skip it if pregnant."] });
  }
  if (r.front && r.front.darkCircle > 0.12) {
    A.push({ id: "eyes", title: "Protect sleep for under-eye darkness", category: "skin", priority: 2, studyIds: ["axelsson2010"],
      why: "People photographed after short sleep were rated as looking less healthy and more tired, with darker eye areas.",
      how: [`Target ${7.5} h in bed with a fixed wake time.`, "Cut caffeine 8 hours before bed and keep the room cool and dark.", "Some dark circles are structural or pigment-related and will not fully change."] });
  }
  if (s.norwood >= 3) {
    A.push({ id: "hair", title: "See a dermatologist about hair loss", category: "grooming", priority: 2, studyIds: ["olsen2002", "kaufman1998"],
      why: "Minoxidil and finasteride are the two treatments with strong trial evidence for male-pattern hair loss, and they work best early.",
      how: ["Book a dermatologist. Finasteride is prescription-only and has side effects to discuss.", "Minoxidil is over the counter. Expect 4–6 months before judging results.", "In the meantime, a shorter cut with texture on top reduces the contrast of a receding hairline."] });
  }
  if (s.hairCondition <= 3 || s.brows <= 3 || s.facialHair <= 3) {
    A.push({ id: "groom", title: "Upgrade grooming basics", category: "grooming", priority: 3, studyIds: [],
      why: "Grooming is the quickest visible change available. It takes minutes a week.",
      how: ["Get a fresh haircut every 3–5 weeks suited to your face shape" + (r.faceShape ? ` (${r.faceShape}).` : "."), "Tidy only stray brow hairs and neaten the neckline and cheek line of any facial hair.", "Floss daily and consider a whitening or cleaning visit if teeth are a weak spot."] });
  }
  A.push({ id: "tongue-note", title: "Keep jaw and tongue work gentle", category: "general", priority: 3, studyIds: ["mewing", "robbins2005"],
    why: "Tongue-posture claims about reshaping the adult jaw are unproven. Strength and posture benefits are real, but over-pressing can cause jaw pain.",
    how: ["Light contact, teeth apart, lips sealed.", "Stop if you feel jaw, ear or temple pain."] });
  return A.sort((a, b) => a.priority - b.priority);
}
