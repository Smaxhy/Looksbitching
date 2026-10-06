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
  kind: "front" | "side";
  dataUrl: string;
}

export type ScoreKey = "jaw" | "symmetry" | "skin" | "grooming";

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
  front?: FrontMetrics;
  measures: Measures;
  self: SelfAssessment;
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
