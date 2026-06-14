// Los módulos de guardia permitidos, en horas.
export const SHIFT_MODULES = [6, 12, 24] as const;

export type ShiftModule = (typeof SHIFT_MODULES)[number];

export const isShiftModule = (n: number): n is ShiftModule =>
  (SHIFT_MODULES as readonly number[]).includes(n);
