export type Sex = "male" | "female" | "unspecified";

export type Tab = "dashboard" | "posture" | "scan" | "routine";

export interface ReminderSettings {
  enabled: boolean;
  posture: boolean;
  postureEveryMin: number;
  wakeStart: string;
  wakeEnd: string;
  hyoid: boolean;
  hyoidAM: string;
  hyoidPM: string;
  skin: boolean;
  skinAM: string;
  skinPM: string;
  water: boolean;
  waterEveryMin: number;
}

export interface Settings {
  name: string;
  startDate: string;
  waterTargetMl: number;
  sleepTargetH: number;
  /** Photos/scans are never uploaded; this just records the user acknowledged the notes. */
  acknowledged: boolean;
  guideDismissed?: boolean;
  /** Confirmed 18+ for the appearance-rating features. */
  adultConfirmed?: boolean;
  sex?: Sex;
  reminders: ReminderSettings;
}

export interface DayLog {
  waterMl: number;
  amSteps: string[];
  pmSteps: string[];
  postureChecks: number;
  sessionAM: boolean;
  sessionPM: boolean;
  sleepHours: number | null;
  weightKg?: number | null;
  /** Exercises completed through the guided timer, by id. */
  done: string[];
}

export interface AppState {
  v: 1;
  settings: Settings;
  logs: Record<string, DayLog>;
  /** Glow-up action ids the user ticked off. */
  actionsDone: Record<string, string>;
}

export interface PhotoRecord {
  id: string;
  ts: number;
  dateKey: string;
  day: number;
  kind: "front" | "side" | "bodyFront" | "bodySide";
  dataUrl: string;
}

export type ScoreKey = "jaw" | "symmetry" | "skin" | "grooming" | "harmony" | "eyes" | "nose" | "structure" | "body";

export interface SelfAssessment {
  submentalFullness: 1 | 2 | 3 | 4 | 5; // 1 = lean, 5 = very full
  skinTight: boolean;
  skinFlaky: boolean;
  skinOily: boolean;
  acne: 0 | 1 | 2 | 3; // none..severe
  norwood: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  hairCondition: 1 | 2 | 3 | 4 | 5;
  brows: 1 | 2 | 3 | 4 | 5;
  facialHair: 1 | 2 | 3 | 4 | 5;
  teeth: 1 | 2 | 3 | 4 | 5;
}

export interface Measures {
  cvaDeg?: number; // craniovertebral angle
  cmaDeg?: number; // cervicomental angle
  gonialDeg?: number; // jaw angle, side view
  nasolabialDeg?: number;
  convexityDeg?: number; // glabella-subnasale-pogonion
}

export interface BodyInputs {
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  neckCm?: number;
  shoulderCm?: number; // shoulder (deltoid) circumference
  age?: number;
}

export type FeatureGroup = "proportion" | "eyes" | "nose" | "mouth" | "jaw" | "midface" | "profile" | "skin" | "body" | "posture";

export interface Feature {
  id: string;
  group: FeatureGroup;
  label: string;
  value: string;
  /** Plain reference range shown to the user. */
  ref: string;
  /** 1-10, or null for descriptive-only traits with no "better" direction. */
  score: number | null;
  note: string;
  confidence: "low" | "medium" | "high";
  source: "photo" | "measured" | "manual" | "self";
}

export interface PoseFront {
  shoulderTiltDeg: number;
  hipTiltDeg: number;
  headTiltDeg: number;
  shoulderHipRatio: number;
  legRatio: number;
  pts: Record<string, [number, number]>;
}
export interface PoseSide {
  headFwd: number; // ear ahead of shoulder, as fraction of torso length
  shoulderFwd: number; // shoulder ahead of hip
  facing: 1 | -1;
  pts: Record<string, [number, number]>;
}

export interface AiReview {
  model: string;
  ts: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  features: { name: string; rating: number; comment: string }[];
  grooming: { hairstyle: string; facialHair: string; eyewear: string; skincare: string; style: string };
  body: string;
  caveats: string;
}

export interface FrontMetrics {
  rollDeg: number;
  yawDeg: number;
  pitchDeg: number;
  asymmetry: number; // mean normalised, ~0.01-0.05 typical
  bigonialRatio: number;
  gonialAngleDeg: number;
  jawEdgeContrast: number;
  darkCircle: number; // relative luminance drop under-eye vs cheek
  texture: number; // mean abs Laplacian of cheek patch (0-255 scale)
  redness: number; // (R-G)/(R+G) on cheek relative to forehead
  brightness: number;
  thirds: [number, number, number];
  faceRatio: number; // face height / width
  quality: { yawOk: boolean; rollOk: boolean; pitchOk: boolean; bright: boolean };
  ratios: Record<string, number>;
  /** MediaPipe landmark index -> normalised [x, y] in the original photo. */
  lm: Record<string, [number, number]>;
  imgW: number;
  imgH: number;
}

export interface CategoryResult {
  key: ScoreKey;
  label: string;
  score: number;
  confidence: "low" | "medium" | "high";
  headline: string;
  details: string[];
  /** Plain-language "how this was computed" lines. */
  basis: string[];
}

export interface ScanResult {
  id: string;
  ts: number;
  dateKey: string;
  day: number;
  frontId?: string;
  sideId?: string;
  bodyFrontId?: string;
  bodySideId?: string;
  front?: FrontMetrics;
  measures: Measures;
  self: SelfAssessment;
  sex?: Sex;
  bodyInputs?: BodyInputs;
  poseFront?: PoseFront;
  poseSide?: PoseSide;
  features?: Feature[];
  aiReview?: AiReview;
  categories: CategoryResult[];
  overall: number;
  faceShape?: string;
}

export interface GlowAction {
  id: string;
  title: string;
  why: string;
  how: string[];
  priority: 1 | 2 | 3;
  category: ScoreKey | "general";
  studyIds: string[];
}
