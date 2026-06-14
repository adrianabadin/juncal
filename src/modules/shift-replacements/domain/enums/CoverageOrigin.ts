export const CoverageOrigin = {
  POSTULATION: "POSTULATION",
  COMPULSORY: "COMPULSORY",
} as const;

export type CoverageOrigin =
  (typeof CoverageOrigin)[keyof typeof CoverageOrigin];

export const isCoverageOrigin = (v: string): v is CoverageOrigin =>
  v === CoverageOrigin.POSTULATION || v === CoverageOrigin.COMPULSORY;
