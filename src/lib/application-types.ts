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
