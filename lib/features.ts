import type { BodyInputs, Feature, FrontMetrics, Measures, PoseFront, PoseSide, Sex } from "./types";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();

/** 10 inside [lo, hi], falling to 3 at `tol` outside it. */
export function band(v: number, lo: number, hi: number, tol: number): number {
  if (v >= lo && v <= hi) return 10;
  const d = v < lo ? lo - v : v - hi;
  return Math.round(clamp(10 - (d / tol) * 7, 2, 10) * 10) / 10;
}

type Mk = Omit<Feature, "id" | "score"> & { id: string; score: number | null };
const mk = (x: Mk): Feature => x;

export function frontFeatures(f: FrontMetrics, sex: Sex): Feature[] {
  const r = f.ratios;
  const out: Feature[] = [];
  const photoConf: Feature["confidence"] = f.quality.yawOk && f.quality.rollOk && f.quality.pitchOk ? "medium" : "low";

  // ── proportions ──
  out.push(mk({ id: "thirds", group: "proportion", label: "Mid-to-lower face balance", value: f2(r.thirdsLM), ref: "0.90–1.15 (lower ≈ middle third)", score: band(r.thirdsLM, 0.9, 1.15, 0.35), confidence: photoConf, source: "photo",
    note: r.thirdsLM > 1.15 ? "Lower third is long relative to the mid-face. A longer chin or lower face." : r.thirdsLM < 0.9 ? "Lower third is short relative to the mid-face. Reads as a shorter chin or lower face." : "Middle and lower thirds are balanced." }));
  out.push(mk({ id: "lowersplit", group: "proportion", label: "Upper lip to chin split", value: f2(r.lowerSplit), ref: "1.7–2.4 (chin ≈ 2× upper lip)", score: band(r.lowerSplit, 1.7, 2.4, 1.0), confidence: "low", source: "photo",
    note: "The classic 1:2 split between nose-to-lip and lip-to-chin. Mouth expression changes it, so hold a relaxed closed mouth." }));
  out.push(mk({ id: "fwhr", group: "proportion", label: "Face width-to-height (fWHR)", value: f2(r.fwhr), ref: "Descriptive. Typical 1.7–2.1", score: null, confidence: photoConf, source: "photo",
    note: r.fwhr > 2.0 ? "Wide midface relative to its height." : r.fwhr < 1.7 ? "Narrower, longer midface." : "Typical midface proportions. No 'better' direction." }));
  out.push(mk({ id: "shape", group: "proportion", label: "Overall face shape", value: f2(f.faceRatio), ref: "Height ÷ width. 1.28–1.45 reads as oval", score: null, confidence: photoConf, source: "photo",
    note: f.faceRatio > 1.45 ? "Long / oblong." : f.faceRatio < 1.28 ? "Short and wide (round or square)." : "Oval proportions." }));

  // ── eyes ──
  out.push(mk({ id: "ipd", group: "eyes", label: "Eye spacing (pupil gap ÷ face width)", value: f2(r.ipdW), ref: "0.42–0.50 (research optimum about 0.46)", score: band(r.ipdW, 0.42, 0.5, 0.08), confidence: photoConf, source: "photo",
    note: "A study of faces rated for attractiveness (Pallett 2010) found judgments peaked near 46% of face width. The effect is small and gentle." }));
  out.push(mk({ id: "icd", group: "eyes", label: "Gap between eyes (one eye-width rule)", value: f2(r.icdEw), ref: "0.90–1.15 (inner-corner gap ≈ one eye width)", score: band(r.icdEw, 0.9, 1.15, 0.4), confidence: photoConf, source: "photo",
    note: r.icdEw > 1.15 ? "Eyes sit relatively wide apart." : r.icdEw < 0.9 ? "Eyes sit relatively close together." : "Classic one-eye-width spacing." }));
  out.push(mk({ id: "canthal", group: "eyes", label: "Canthal tilt (eye angle)", value: `${f1(r.canthal)}°`, ref: "+2° to +10° (outer corner slightly higher)", score: band(r.canthal, 2, 10, 8), confidence: "low", source: "photo",
    note: r.canthal > 10 ? "Strongly upward-tilted eyes." : r.canthal < 0 ? "Outer corners sit lower than inner corners ('downturned'). Often looks tired. Tilt your head up slightly for a fair read." : "Neutral to gently upward tilt, which reads as alert." }));
  out.push(mk({ id: "eyeopen", group: "eyes", label: "Eye openness", value: f2(r.eyeOpen), ref: "0.28–0.42 (height ÷ width)", score: band(r.eyeOpen, 0.28, 0.42, 0.2), confidence: "low", source: "photo",
    note: "Changes with expression, squinting and blinking. Retake with relaxed, wide-open eyes if this looks off." }));
  out.push(mk({ id: "browtilt", group: "eyes", label: "Brow angle", value: `${f1(r.browTilt)}°`, ref: "0° to 15° rise toward the outer end", score: band(r.browTilt, 0, 15, 15), confidence: "low", source: "photo",
    note: r.browTilt < 0 ? "Brows slope down toward the outside." : r.browTilt > 15 ? "Steeply arched brows." : "Natural, gently rising brows." }));
  out.push(mk({ id: "browset", group: "eyes", label: "Brow height above the eye", value: f2(r.browEye * 100) + "% of face", ref: "5.5–9.5% of face height", score: band(r.browEye * 100, 5.5, 9.5, 5), confidence: "low", source: "photo",
    note: r.browEye * 100 < 5.5 ? "Low-set brows close to the eyes, which gives a deep-set look." : r.browEye * 100 > 9.5 ? "High-set brows with more lid space." : "Brow height is in the typical range." }));

  // ── nose ──
  out.push(mk({ id: "nosew", group: "nose", label: "Nose width vs eye gap", value: f2(r.noseW), ref: "0.90–1.30 (nostril width ≈ gap between eyes)", score: band(r.noseW, 0.9, 1.3, 0.5), confidence: "low", source: "photo",
    note: "Typical ranges differ across ancestries, so treat this as a description and not a flaw." }));
  out.push(mk({ id: "nosewface", group: "nose", label: "Nose width vs face width", value: `${f2(r.noseWFace * 100)}%`, ref: "Descriptive. Typical 24–30%", score: null, confidence: "low", source: "photo",
    note: "Share of face width taken by the base of the nose." }));

  // ── mouth ──
  out.push(mk({ id: "mouthw", group: "mouth", label: "Mouth width vs eye distance", value: f2(r.mouthW), ref: "0.72–0.95 of pupil distance", score: band(r.mouthW, 0.72, 0.95, 0.3), confidence: "low", source: "photo",
    note: "Smiling widens the mouth. Compare scans taken with the same relaxed expression." }));
  out.push(mk({ id: "lips", group: "mouth", label: "Lip balance (lower ÷ upper)", value: f2(r.lipRatio), ref: "1.1–1.8 (lower lip fuller, about 1.6 is the classic)", score: band(r.lipRatio, 1.1, 1.8, 0.8), confidence: "low", source: "photo",
    note: "Measured at rest. Lipstick, tension and a slight smile all move this number." }));

  // ── jaw & midface ──
  const jawBand: [number, number] = sex === "male" ? [0.78, 0.92] : sex === "female" ? [0.68, 0.82] : [0.72, 0.88];
  out.push(mk({ id: "jawwidth", group: "jaw", label: "Jaw width vs cheekbone width", value: f2(f.bigonialRatio), ref: `${jawBand[0]}–${jawBand[1]} ${sex === "unspecified" ? "(neutral range)" : sex}`, score: band(f.bigonialRatio, jawBand[0], jawBand[1], 0.15), confidence: photoConf, source: "photo",
    note: f.bigonialRatio > jawBand[1] ? "Broad, square jaw relative to the cheekbones." : f.bigonialRatio < jawBand[0] ? "Narrower, more tapered lower face." : "Lower face width is in the typical range." }));
  out.push(mk({ id: "jawedge", group: "jaw", label: "Visible jawline edge", value: `${f1(f.jawEdgeContrast * 100)}%`, ref: "7–20% contrast along the jaw", score: band(f.jawEdgeContrast * 100, 7, 20, 7), confidence: "low", source: "photo",
    note: "How sharply the jaw edge shows against the neck. Lighting from above helps. Body fat and head posture affect it more than anything." }));
  out.push(mk({ id: "chinw", group: "jaw", label: "Chin width vs jaw width", value: f2(r.chinW), ref: "Descriptive", score: null, confidence: "low", source: "photo",
    note: r.chinW > 0.5 ? "Broad chin." : r.chinW < 0.36 ? "Narrow or pointed chin." : "Average chin width. No 'better' direction." }));
  out.push(mk({ id: "cheek", group: "midface", label: "Cheekbone width vs jaw width", value: f2(r.cheekTaper), ref: "Descriptive. Typical 1.12–1.35", score: null, confidence: photoConf, source: "photo",
    note: r.cheekTaper > 1.3 ? "Cheekbones noticeably wider than the jaw (tapered lower face)." : r.cheekTaper < 1.12 ? "Jaw nearly as wide as the cheekbones (square)." : "Typical cheekbone-to-jaw balance." }));
  out.push(mk({ id: "temple", group: "midface", label: "Forehead width vs cheekbones", value: f2(r.templeW), ref: "Descriptive. Typical 0.80–0.95", score: null, confidence: "low", source: "photo",
    note: "Forehead width at the temples relative to the widest part of the face." }));
  out.push(mk({ id: "sym", group: "proportion", label: "Left-right symmetry", value: `${f2(f.asymmetry * 100)}% mismatch`, ref: "Under about 3% is normal", score: Math.round(clamp(10 - Math.max(0, f.asymmetry - 0.008) * 100, 2, 10) * 10) / 10, confidence: f.quality.yawOk && f.quality.rollOk ? "medium" : "low", source: "photo",
    note: "Everyone is asymmetric. Head turn and tilt inflate this number. Rhodes 2006 found symmetry has only a modest effect on rated attractiveness." }));
  return out;
}

export function profileFeatures(m: Measures, sex: Sex): Feature[] {
  const out: Feature[] = [];
  if (m.cvaDeg != null) out.push(mk({ id: "cva", group: "posture", label: "Head posture (craniovertebral angle)", value: `${Math.round(m.cvaDeg)}°`, ref: "50° or more is typical. Lower means head forward", score: band(m.cvaDeg, 50, 70, 20), confidence: "medium", source: "manual",
    note: m.cvaDeg >= 50 ? "Head sits over the shoulders." : "Forward-head posture. This is the part of the programme with the strongest evidence." }));
  if (m.cmaDeg != null) out.push(mk({ id: "cma", group: "jaw", label: "Chin–neck angle (cervicomental)", value: `${Math.round(m.cmaDeg)}°`, ref: "105–120° benchmark", score: band(m.cmaDeg, 105, 120, 40), confidence: "medium", source: "manual",
    note: m.cmaDeg > 120 ? "Wider than the benchmark. Body fat under the chin, head position and chin projection all drive this." : m.cmaDeg < 105 ? "Sharper than the benchmark, which usually reads as a well-defined neck line." : "Inside the 105–120° benchmark." }));
  if (m.gonialDeg != null) {
    const b: [number, number] = sex === "male" ? [112, 126] : sex === "female" ? [118, 132] : [115, 130];
    out.push(mk({ id: "gonial", group: "profile", label: "Jaw angle (gonial, side view)", value: `${Math.round(m.gonialDeg)}°`, ref: `${b[0]}–${b[1]}° typical`, score: band(m.gonialDeg, b[0], b[1], 20), confidence: "medium", source: "manual",
      note: m.gonialDeg < b[0] ? "More angular jaw corner than average." : m.gonialDeg > b[1] ? "Softer, more obtuse jaw corner. Soft-tissue fullness can add to this." : "Jaw angle in the typical range." }));
  }
  if (m.nasolabialDeg != null) {
    const b: [number, number] = sex === "male" ? [88, 102] : sex === "female" ? [95, 115] : [90, 110];
    out.push(mk({ id: "nasolabial", group: "profile", label: "Nose-to-lip angle (nasolabial)", value: `${Math.round(m.nasolabialDeg)}°`, ref: `${b[0]}–${b[1]}° typical`, score: band(m.nasolabialDeg, b[0], b[1], 25), confidence: "medium", source: "manual",
      note: m.nasolabialDeg < b[0] ? "Tip sits low relative to the upper lip." : m.nasolabialDeg > b[1] ? "Tip tilts up (rotated)." : "Nose tip rotation in the typical range." }));
  }
  if (m.convexityDeg != null) out.push(mk({ id: "convexity", group: "profile", label: "Profile convexity (forehead–nose–chin)", value: `${Math.round(m.convexityDeg)}°`, ref: "160–175° straight to gently convex", score: band(m.convexityDeg, 160, 175, 15), confidence: "medium", source: "manual",
    note: m.convexityDeg < 160 ? "Convex profile: chin sits behind the line from forehead to nose base, so it can read as recessed." : m.convexityDeg > 175 ? "Very flat or concave profile with a prominent chin." : "Balanced profile with a well-positioned chin." }));
  return out;
}

export function navyBodyFat(sex: Sex, b: BodyInputs): number | null {
  const { heightCm: h, waistCm: w, neckCm: n, hipCm: hip } = b;
  if (!h || !w || !n) return null;
  if (sex === "female") {
    if (!hip || w + hip - n <= 0) return null;
    return 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.221 * Math.log10(h)) - 450;
  }
  if (w - n <= 0) return null;
  return 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
}

export function bodyFeatures(b: BodyInputs, sex: Sex, front?: PoseFront, side?: PoseSide): Feature[] {
  const out: Feature[] = [];
  if (b.heightCm && b.weightKg) {
    const bmi = b.weightKg / (b.heightCm / 100) ** 2;
    out.push(mk({ id: "bmi", group: "body", label: "Body mass index", value: f1(bmi), ref: "18.5–24.9 (population screening range)", score: band(bmi, 18.5, 25, 8), confidence: "low", source: "measured",
      note: "Cannot tell muscle from fat. A muscular person can read 'overweight'. Use it with waist-to-height." }));
  }
  if (b.heightCm && b.waistCm) {
    const w = b.waistCm / b.heightCm;
    out.push(mk({ id: "whtr", group: "body", label: "Waist-to-height ratio", value: f2(w), ref: "0.40–0.49 (keep waist under half your height)", score: band(w, 0.4, 0.49, 0.12), confidence: "medium", source: "measured",
      note: "Ashwell 2012 (meta-analysis) found waist-to-height predicts cardiometabolic risk better than BMI. At 0.5 or above, risk rises. This is also the best single number for submental and facial leanness over time." }));
  }
  if (b.waistCm && b.hipCm) {
    const w = b.waistCm / b.hipCm;
    const band_: [number, number] = sex === "female" ? [0.65, 0.85] : [0.75, 0.9];
    out.push(mk({ id: "whr", group: "body", label: "Waist-to-hip ratio", value: f2(w), ref: `${band_[0]}–${band_[1]}`, score: band(w, band_[0], band_[1], 0.15), confidence: "medium", source: "measured",
      note: "Where you carry weight. Lower values tend to track with lower visceral fat." }));
  }
  const bf = navyBodyFat(sex, b);
  if (bf != null && bf > 2 && bf < 60) {
    const bb: [number, number] = sex === "female" ? [18, 28] : [10, 20];
    out.push(mk({ id: "bf", group: "body", label: "Estimated body fat (US Navy method)", value: `${f1(bf)}%`, ref: `${bb[0]}–${bb[1]}% athletic to average (±3–4% error)`, score: band(bf, bb[0], bb[1], 12), confidence: "low", source: "measured",
      note: bf > bb[1] ? "Above the average band. Under-chin fullness usually responds once overall body fat drops." : bf < bb[0] ? "Lean. Make sure lean is also healthy for you." : "In the athletic to average range." }));
  }
  if (b.shoulderCm && b.waistCm) {
    const v = b.shoulderCm / b.waistCm;
    out.push(mk({ id: "vtaper", group: "body", label: "Shoulder-to-waist (V-taper)", value: f2(v), ref: sex === "female" ? "Descriptive" : "1.35–1.65 for a pronounced taper", score: sex === "female" ? null : band(v, 1.35, 1.65, 0.35), confidence: "low", source: "measured",
      note: "Shoulder circumference ÷ waist circumference. Built mostly by shoulder and back training and by reducing waist size." }));
  }
  if (front) {
    out.push(mk({ id: "shoulderlevel", group: "posture", label: "Shoulder level", value: `${f1(Math.abs(front.shoulderTiltDeg))}° tilt`, ref: "Under 2°", score: band(Math.abs(front.shoulderTiltDeg), 0, 2, 5), confidence: "low", source: "photo",
      note: "One shoulder higher than the other. Standing off-level or a bag habit can cause it." }));
    out.push(mk({ id: "hiplevel", group: "posture", label: "Hip level", value: `${f1(Math.abs(front.hipTiltDeg))}° tilt`, ref: "Under 2°", score: band(Math.abs(front.hipTiltDeg), 0, 2, 5), confidence: "low", source: "photo", note: "Stand with weight even on both feet." }));
    out.push(mk({ id: "shoulderhip", group: "body", label: "Shoulder width vs hip width", value: f2(front.shoulderHipRatio), ref: "Descriptive. Clothing changes this", score: null, confidence: "low", source: "photo", note: "Taken from joint positions in the photo." }));
    out.push(mk({ id: "legratio", group: "body", label: "Leg length share of height", value: `${f1(front.legRatio * 100)}%`, ref: "Descriptive. Typical 45–52%", score: null, confidence: "low", source: "photo", note: "Hip-to-ankle length against hip-to-shoulder length. Descriptive only." }));
  }
  if (side) {
    out.push(mk({ id: "fwdhead", group: "posture", label: "Head over shoulder (side)", value: `${f1(side.headFwd * 100)}% of torso`, ref: "Under about 10%", score: band(side.headFwd, -0.05, 0.1, 0.15), confidence: "medium", source: "photo",
      note: side.headFwd > 0.1 ? "Ear sits ahead of the shoulder, which is forward-head posture." : "Head is stacked over the shoulder." }));
    out.push(mk({ id: "roundsh", group: "posture", label: "Shoulders over hips (side)", value: `${f1(side.shoulderFwd * 100)}% of torso`, ref: "Within about ±6%", score: band(side.shoulderFwd, -0.06, 0.06, 0.15), confidence: "low", source: "photo",
      note: side.shoulderFwd > 0.06 ? "Shoulders roll forward of the hips." : "Shoulders are stacked over the hips." }));
  }
  return out;
}

export const GROUP_LABEL: Record<Feature["group"], string> = {
  proportion: "Face proportions", eyes: "Eyes & brows", nose: "Nose", mouth: "Lips & mouth", jaw: "Jaw & chin", midface: "Cheekbones & forehead",
  profile: "Side profile", skin: "Skin", body: "Body composition & proportions", posture: "Posture",
};
