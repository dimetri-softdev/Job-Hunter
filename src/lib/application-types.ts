export type FitVerdict =
  | "STRONG_MATCH"
  | "POSSIBLE_MATCH"
  | "STRETCH"
  | "LOW_MATCH"
  | "INSUFFICIENT_INFO";

export interface FitAssessment {
  verdict: FitVerdict;
  roleTitle: string;
  assessment: string;
  strengths: string[];
  gaps: string[];
  questionsToConfirm: string[];
}

export interface ApplicationRoadmap {
  id: string;
  title: string;
}

export interface OfferDetails {
  annualCompensation: number | null;
  currency: string | null;
  commuteMinutes: number | null;
  learning: number | null;
  stability: number | null;
  workLife: number | null;
}

export interface OfferPriorities {
  salary: number;
  commute: number;
  learning: number;
  stability: number;
  workLife: number;
}
