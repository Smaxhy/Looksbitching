import { study } from "./evidence";
import type { Grade } from "./evidence";

export type ExerciseId = "tongue-posture" | "hyoid-hold" | "chin-tuck" | "neck-flexor-curl" | "tongue-press" | "tongue-stretch";

export interface Exercise {
  id: ExerciseId;
  name: string;
  short: string;
  target: string;
  grade: Grade;
  /** Honest one-liner on what the evidence supports. */
  evidenceNote: string;
  studyIds: string[];
  steps: string[];
  cues: string[];
  mistakes: string[];
  safety: string;
  mode: "reps" | "duration";
  accent: "vio" | "emr";
}

export const EXERCISES: Record<ExerciseId, Exercise> = {
  "tongue-posture": {
    id: "tongue-posture",
    name: "Tongue posture (mewing)",
    short: "Resting tongue-to-palate position, lips sealed, nose breathing.",
    target: "Resting posture, nasal breathing",
    grade: "unproven",
    evidenceNote: "A harmless habit. No adult trials show it reshapes the jaw or lifts the hyoid.",
    studyIds: ["mewing", "camacho2015"],
    steps: [
      "Close your lips gently and breathe through your nose.",
      "Rest the whole tongue against the roof of your mouth, not just the tip. The back third should be up too.",
      "Place the tip just behind the front teeth, on the ridge, without touching them.",
      "Keep the back teeth slightly apart. Teeth together is clenching, not posture.",
      "Lengthen the back of your neck and let the chin sit level, ears over shoulders.",
    ],
    cues: ["Say 'N' and notice where the tongue lands. Hold it there.", "Swallow once. The tongue should press up and back, not push forward on the teeth."],
    mistakes: ["Pressing hard or clenching. This loads the jaw joint.", "Tongue tip jammed on the front teeth.", "Tucking the chin to 'show' the jawline."],
    safety: "Stop if you get jaw, ear or temple pain. Light contact only.",
    mode: "duration",
    accent: "vio",
  },
  "hyoid-hold": {
    id: "hyoid-hold",
    name: "Swallow-and-hold hyoid raise",
    short: "Mendelsohn-style hold: lift and hold the voice box up mid-swallow.",
    target: "Suprahyoid muscles, hyoid elevation",
    grade: "moderate",
    evidenceNote: "Trains the muscles that lift the hyoid and improves hyoid excursion in swallowing studies. Aesthetic change in healthy adults is not shown.",
    studyIds: ["kahrilas1991", "shaker2002"],
    steps: [
      "Sit tall with your tongue pressed flat to the palate.",
      "Swallow saliva. Feel your voice box (Adam's apple) rise.",
      "At the top of the swallow, keep it up. Squeeze the muscles under your chin and hold for the timer.",
      "Keep breathing quietly through your nose if you can. Release slowly, rest, and repeat.",
    ],
    cues: ["Fingertips lightly on the voice box. You should feel it stay high.", "Tongue stays pressed up the whole hold."],
    mistakes: ["Holding your breath hard.", "Tensing the neck and shoulders instead of the muscles under the chin.", "Dry swallowing repeatedly until the throat is sore."],
    safety: "Stop if you choke, cough or feel pain. If you have a swallowing disorder, do this only with a speech-language pathologist.",
    mode: "reps",
    accent: "vio",
  },
  "chin-tuck": {
    id: "chin-tuck",
    name: "Chin tuck",
    short: "Glide the head straight back to stack ears over shoulders.",
    target: "Deep neck flexors, forward-head posture",
    grade: "moderate",
    evidenceNote: "Craniocervical flexion training improves upright posture control and neck pain. From week 5 it becomes a resisted tuck (CTAR), which loads the suprahyoids.",
    studyIds: ["falla2007", "jull2002", "yoon2014"],
    steps: [
      "Sit or stand tall, eyes level. Relax your shoulders down.",
      "Glide your head straight back as if making a double chin. Don't tilt it down.",
      "Hold the timer, feeling the front of the neck engage and the back of the neck lengthen.",
      "Return slowly. From week 5, press your fist or a towel under the chin for resistance.",
    ],
    cues: ["Imagine a string pulling the crown of your head to the ceiling.", "The gaze stays level the entire time."],
    mistakes: ["Nodding the head down instead of gliding back.", "Jutting the jaw.", "Shrugging the shoulders."],
    safety: "Stop with dizziness, arm numbness or sharp pain. Move gently if you have a neck injury.",
    mode: "reps",
    accent: "emr",
  },
  "neck-flexor-curl": {
    id: "neck-flexor-curl",
    name: "Neck flexor curl (craniocervical flexion)",
    short: "Lying down, gently nod the head and hold. Low effort, high control.",
    target: "Deep cervical flexors",
    grade: "strong",
    evidenceNote: "Low-load craniocervical flexion with 10-second holds is the best-evidenced neck exercise for posture and neck pain.",
    studyIds: ["jull2002", "falla2007"],
    steps: [
      "Lie on your back, knees bent, a thin folded towel under the head so the face is level.",
      "Tongue on the palate, jaw relaxed. Slowly nod as if saying a small 'yes' (about 10–20% effort).",
      "Hold for the timer without lifting the head off the floor and without pushing the tongue or clenching.",
      "Return slowly. Rest between reps.",
    ],
    cues: ["Think 'long neck', not 'strong neck'.", "If the front of the neck bulges hard, you're using too much force."],
    mistakes: ["Lifting the head.", "Using the big neck muscles (sternocleidomastoid) and pushing the chin forward.", "Holding your breath."],
    safety: "Keep the effort low. Stop if you feel dizziness, pain or tingling.",
    mode: "reps",
    accent: "emr",
  },
  "tongue-press": {
    id: "tongue-press",
    name: "Tongue press (palate pressing)",
    short: "Press the tongue up against the palate, hold, release.",
    target: "Tongue strength",
    grade: "moderate",
    evidenceNote: "Progressive tongue-press exercise increases tongue strength and swallow pressures in older adults. Jaw-shape effects are not shown.",
    studyIds: ["robbins2005", "camacho2015"],
    steps: [
      "Place the tongue tip on the ridge behind the upper front teeth.",
      "Press the whole tongue up against the palate, firmly but not maximally (about 6–7 out of 10).",
      "Hold for the timer, with lips closed and teeth slightly apart.",
      "Release and rest briefly. Repeat.",
    ],
    cues: ["Feel the middle of the tongue flatten against the palate.", "Keep the lower jaw relaxed."],
    mistakes: ["Clenching the teeth.", "Pushing the tongue into the front teeth."],
    safety: "Stop if jaw or ear pain appears.",
    mode: "reps",
    accent: "vio",
  },
  "tongue-stretch": {
    id: "tongue-stretch",
    name: "Tongue stretches",
    short: "Four-direction stretch used in myofunctional therapy.",
    target: "Tongue mobility, oral posture",
    grade: "moderate",
    evidenceNote: "A standard part of myofunctional therapy programmes that reduced sleep apnoea severity. Nothing on jawline.",
    studyIds: ["camacho2015"],
    steps: [
      "Stick the tongue straight out and reach toward the chin. Hold.",
      "Reach toward the nose. Hold.",
      "Reach to the left corner of the mouth, then the right. Hold each.",
      "Draw the tongue back, press it to the palate, and relax.",
    ],
    cues: ["Slow and relaxed. This is a stretch, not a strain."],
    mistakes: ["Forcing past a pulling sensation.", "Letting the jaw drop forward."],
    safety: "Never force. Mild pulling only.",
    mode: "duration",
    accent: "vio",
  },
};


export interface Prescription {
  exercise: ExerciseId;
  sets: number;
  reps: number;
  holdSec: number;
  restSec: number; // between reps
  setRestSec: number;
  /** for duration-mode exercises */
  durationSec?: number;
  note?: string;
}

export interface WeekSpec {
  week: number;
  phase: string;
  blurb: string;
  hyoid: { sets: number; reps: number; hold: number };
  tuck: { sets: number; reps: number; hold: number; resisted: boolean };
  curl: { sets: number; reps: number; hold: number } | null;
  press: { sets: number; reps: number; hold: number };
  stretchRounds: number;
  stretchHold: number;
  postureTarget: number;
}

export const WEEKS: WeekSpec[] = [
  { week: 1, phase: "Foundation", blurb: "Learn the positions. Light volume, perfect technique.", hyoid: { sets: 2, reps: 8, hold: 3 }, tuck: { sets: 2, reps: 10, hold: 3, resisted: false }, curl: null, press: { sets: 2, reps: 10, hold: 2 }, stretchRounds: 2, stretchHold: 10, postureTarget: 5 },
  { week: 2, phase: "Foundation", blurb: "Hold the hyoid raise to 5 seconds and add the neck flexor curl.", hyoid: { sets: 2, reps: 10, hold: 5 }, tuck: { sets: 2, reps: 12, hold: 3, resisted: false }, curl: { sets: 2, reps: 10, hold: 3 }, press: { sets: 2, reps: 10, hold: 2 }, stretchRounds: 2, stretchHold: 12, postureTarget: 6 },
  { week: 3, phase: "Build", blurb: "Third set arrives on the hyoid hold. Neck curls get longer.", hyoid: { sets: 3, reps: 10, hold: 5 }, tuck: { sets: 3, reps: 12, hold: 4, resisted: false }, curl: { sets: 2, reps: 12, hold: 4 }, press: { sets: 3, reps: 10, hold: 3 }, stretchRounds: 2, stretchHold: 15, postureTarget: 6 },
  { week: 4, phase: "Build", blurb: "Full 3 × 10 and 3 × 15 volume on posture work.", hyoid: { sets: 3, reps: 10, hold: 6 }, tuck: { sets: 3, reps: 15, hold: 4, resisted: false }, curl: { sets: 3, reps: 12, hold: 5 }, press: { sets: 3, reps: 10, hold: 3 }, stretchRounds: 3, stretchHold: 15, postureTarget: 7 },
  { week: 5, phase: "Strength", blurb: "Resisted chin tucks (CTAR) begin. Holds keep growing.", hyoid: { sets: 3, reps: 10, hold: 7 }, tuck: { sets: 3, reps: 15, hold: 5, resisted: true }, curl: { sets: 3, reps: 15, hold: 5 }, press: { sets: 3, reps: 10, hold: 4 }, stretchRounds: 3, stretchHold: 15, postureTarget: 8 },
  { week: 6, phase: "Strength", blurb: "Push holds to 8 seconds. Keep form clean.", hyoid: { sets: 3, reps: 10, hold: 8 }, tuck: { sets: 3, reps: 15, hold: 5, resisted: true }, curl: { sets: 3, reps: 15, hold: 6 }, press: { sets: 3, reps: 10, hold: 4 }, stretchRounds: 3, stretchHold: 20, postureTarget: 8 },
  { week: 7, phase: "Peak", blurb: "Near-maximum holds. Posture checks should feel automatic.", hyoid: { sets: 3, reps: 10, hold: 9 }, tuck: { sets: 3, reps: 15, hold: 6, resisted: true }, curl: { sets: 3, reps: 15, hold: 7 }, press: { sets: 3, reps: 12, hold: 5 }, stretchRounds: 3, stretchHold: 20, postureTarget: 8 },
  { week: 8, phase: "Peak", blurb: "10-second holds. Retest your scan on day 60.", hyoid: { sets: 3, reps: 10, hold: 10 }, tuck: { sets: 3, reps: 15, hold: 6, resisted: true }, curl: { sets: 3, reps: 15, hold: 8 }, press: { sets: 3, reps: 12, hold: 5 }, stretchRounds: 3, stretchHold: 20, postureTarget: 8 },
];

export const PROGRAM_DAYS = 60;
export const REST_DAYS = new Set([7, 14, 21, 28, 35, 42, 49, 56]);
export const MILESTONES = [7, 30, 60] as const;

export interface DayPlan {
  day: number;
  week: number;
  spec: WeekSpec;
  rest: boolean;
  milestone?: string;
  scanDay: boolean;
  morning: Prescription[];
  evening: Prescription[];
  postureTarget: number;
}

export function weekOf(day: number): number {
  return Math.min(8, Math.max(1, Math.ceil(day / 7)));
}

export function getDayPlan(day: number): DayPlan {
  const week = weekOf(day);
  const spec = WEEKS[week - 1];
  const rest = REST_DAYS.has(day);
  const gap = (hold: number) => Math.max(2, Math.min(4, Math.round(hold / 2)));
  const posture: Prescription = {
    exercise: "tongue-posture", sets: 1, reps: 1, holdSec: 0, restSec: 0, setRestSec: 0, durationSec: 60,
    note: "One-minute reset, then check in every 2 hours.",
  };
  const stretch: Prescription = {
    exercise: "tongue-stretch", sets: spec.stretchRounds, reps: 4, holdSec: spec.stretchHold, restSec: 2, setRestSec: 5,
    durationSec: spec.stretchRounds * 4 * spec.stretchHold,
  };
  const hyoid: Prescription = { exercise: "hyoid-hold", sets: spec.hyoid.sets, reps: spec.hyoid.reps, holdSec: spec.hyoid.hold, restSec: gap(spec.hyoid.hold), setRestSec: 30 };
  const press: Prescription = { exercise: "tongue-press", sets: spec.press.sets, reps: spec.press.reps, holdSec: spec.press.hold, restSec: 2, setRestSec: 20 };
  const tuck: Prescription = {
    exercise: "chin-tuck", sets: spec.tuck.sets, reps: spec.tuck.reps, holdSec: spec.tuck.hold, restSec: 2, setRestSec: 25,
    note: spec.tuck.resisted ? "Resisted: press a fist or towel under the chin." : undefined,
  };
  const curl: Prescription | null = spec.curl
    ? { exercise: "neck-flexor-curl", sets: spec.curl.sets, reps: spec.curl.reps, holdSec: spec.curl.hold, restSec: 3, setRestSec: 30 }
    : null;

  let morning: Prescription[];
  let evening: Prescription[];
  if (rest) {
    // light recovery day: posture and mobility only, no loaded holds
    morning = [posture];
    evening = [stretch, { ...tuck, sets: 1, reps: 10, holdSec: 3, note: "Easy recovery set. No resistance." }];
  } else {
    morning = [hyoid, press];
    evening = [tuck, ...(curl ? [curl] : []), stretch];
  }

  const milestone = day === 1 ? "Baseline scan" : day === 30 ? "Midpoint scan" : day === 60 ? "Final scan" : undefined;
  return { day, week, spec, rest, milestone, scanDay: !!milestone, morning, evening, postureTarget: spec.postureTarget };
}

export function prescriptionMinutes(p: Prescription): number {
  if (p.durationSec) return Math.max(1, Math.ceil(p.durationSec / 60));
  const work = p.sets * p.reps * (p.holdSec + p.restSec) + (p.sets - 1) * p.setRestSec;
  return Math.max(1, Math.ceil(work / 60));
}

export function describe(p: Prescription): string {
  const ex = EXERCISES[p.exercise];
  if (ex.mode === "duration" && p.exercise === "tongue-posture") return "60 s reset";
  if (p.exercise === "tongue-stretch") return `${p.sets} rounds × 4 directions × ${p.holdSec}s`;
  return `${p.sets} × ${p.reps}, hold ${p.holdSec}s`;
}

export function studiesFor(id: ExerciseId) {
  return EXERCISES[id].studyIds.map((s) => study(s));
}
