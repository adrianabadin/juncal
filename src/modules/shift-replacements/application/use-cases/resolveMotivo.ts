import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";
import { OTROS_REASON_NAME } from "@shift-replacements/domain/schemas/shift-replacement.schema";

export interface ResolvedMotivo {
  absenceReasonId: string;
  observation: string | null;
}

// Authoritative server-side motivo validation shared by RequestAbsence and
// CreateCompulsoryReplacement. The Zod schema mirrors the observation rule
// client-side, but only the repository can confirm the reason exists, is
// active, and whether it is a protected default.
//
// Product rule: an observation is mandatory ONLY when the resolved reason name
// is exactly "Otros". Custom non-default reasons (e.g. "Curso") do NOT require
// an observation solely because they are non-default; they may carry one
// optionally. This mirrors `requireObservationForCustomReason` in the schema.
export async function resolveMotivo(
  reasons: AbsenceReasonRepository,
  absenceReasonId: string,
  observation: string | null,
): Promise<Result<ResolvedMotivo, DomainError>> {
  const reason = await reasons.findById(absenceReasonId);
  if (!reason || !reason.isActive)
    return err(
      new DomainError("INVALID_MOTIVO", "El motivo seleccionado no es válido"),
    );

  const trimmed = observation?.trim() ? observation.trim() : null;
  const requiresObservation = reason.name === OTROS_REASON_NAME;

  if (requiresObservation && !trimmed)
    return err(
      new DomainError("OBSERVATION_REQUIRED", "Ingrese una observación"),
    );

  // Default reasons never carry an observation; custom reasons preserve any
  // provided observation (required for "Otros", optional otherwise).
  const finalObservation = reason.isDefault ? null : trimmed;

  return ok({ absenceReasonId: reason.id, observation: finalObservation });
}
