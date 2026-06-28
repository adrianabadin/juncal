import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export interface DeleteAbsenceReasonCommand {
  actorIsCoordinator: boolean;
  id: string;
}

export class DeleteAbsenceReason {
  constructor(private readonly repo: AbsenceReasonRepository) {}

  async execute(cmd: DeleteAbsenceReasonCommand): Promise<Result<void, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra los motivos"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Motivo inexistente"));
    if (!found.canDelete())
      return err(new DomainError("DEFAULT_PROTECTED", "Los motivos por defecto no se pueden eliminar"));
    await this.repo.delete(cmd.id);
    return ok(undefined);
  }
}
