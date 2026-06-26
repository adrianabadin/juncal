export interface DefaultAbsenceReason {
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

// Seeded on migration. These four reasons are protected: they may be renamed or
// deactivated by a coordinator, but never hard-deleted (see DeleteAbsenceReason).
export const defaultAbsenceReasons: readonly DefaultAbsenceReason[] = [
  { name: "Motivos Personales", isDefault: true, isActive: true },
  { name: "Vacaciones", isDefault: true, isActive: true },
  { name: "Cambio de guardia", isDefault: true, isActive: true },
  { name: "Congresos", isDefault: true, isActive: true },
];
