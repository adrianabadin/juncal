import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export interface ResolvedMotivo {
  absenceReasonId: string;
  observation: string | null;
}

// Authoritative server-side motivo validation shared by RequestAbsence and
// CreateCompulsoryReplacement. The Zod schema mirrors the "custom reasons
// require observation" rule client-side, but only the repository can confirm
// the reason exists, is active, and whether it is a protected default.
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
  const isCustom = !reason.isDefault;

  if (isCustom && !trimmed)
    return err(
      new DomainError("OBSERVATION_REQUIRED", "Ingrese una observación"),
    );

  // Default reasons never carry an observation; only custom reasons do.
  const finalObservation = isCustom ? trimmed : null;

  return ok({ absenceReasonId: reason.id, observation: finalObservation });
}
