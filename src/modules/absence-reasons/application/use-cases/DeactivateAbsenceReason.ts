import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export interface DeactivateAbsenceReasonCommand {
  actorIsCoordinator: boolean;
  id: string;
}

export class DeactivateAbsenceReason {
  constructor(private readonly repo: AbsenceReasonRepository) {}

  async execute(cmd: DeactivateAbsenceReasonCommand): Promise<Result<AbsenceReason, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra los motivos"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Motivo inexistente"));
    found.deactivate();
    return ok(await this.repo.save(found));
  }
}
