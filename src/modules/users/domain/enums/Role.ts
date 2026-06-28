export const Role = {
  BASE_PROFESSIONAL: "BASE_PROFESSIONAL",
  COORDINATOR: "COORDINATOR",
  RRHH: "RRHH",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const isRole = (v: string): v is Role =>
  v === Role.BASE_PROFESSIONAL ||
  v === Role.COORDINATOR ||
  v === Role.RRHH;