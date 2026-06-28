export interface AbsenceReasonOption {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

const SIN_MOTIVO_LABEL = "Sin motivo";

// Shared react-hook-form defaults for the motivo-bearing absence forms. The
// "Bajo factura" checkbox must start unchecked (spec SR-7); seeding both forms
// from one object keeps that default consistent and unit-testable.
export const absenceFormDefaults = {
  bajoFactura: false as const,
};

// Only active reasons may be offered as selectable dropdown options. Deactivated
// motivos (e.g. Enfermedad/Otros once turned off — spec AR-6) must never render
// for new requests, even if a caller passes a list that still contains them.
export function visibleAbsenceReasons(
  reasons: AbsenceReasonOption[],
): AbsenceReasonOption[] {
  return reasons.filter((r) => r.isActive);
}

// Resolve a selected reason id to its name. Returns undefined when nothing is
// selected or the id is unknown, so callers can drive conditional UI.
export function resolveAbsenceReasonName(
  reasons: AbsenceReasonOption[],
  selectedId: string,
): string | undefined {
  if (!selectedId) return undefined;
  return reasons.find((r) => r.id === selectedId)?.name;
}

// The observation textarea is required for any custom (non-default) reason.
// A reason is custom when it exists in the active list and is not a protected
// default. Unknown or unselected names are treated as not custom. Centralizing
// this rule keeps the form UI and the schema's superRefine in agreement.
export function isCustomReason(
  reasonName: string | undefined,
  reasons: AbsenceReasonOption[],
): boolean {
  if (!reasonName) return false;
  const reason = reasons.find((r) => r.name === reasonName);
  return reason ? !reason.isDefault : false;
}

// Legacy ShiftReplacement records predate motivo capture and carry no reason;
// they must render as "Sin motivo" (spec SR-5).
export function displayAbsenceReason(reasonName: string | null | undefined): string {
  return reasonName ?? SIN_MOTIVO_LABEL;
}
