import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export interface UpdateAbsenceReasonCommand {
  actorIsCoordinator: boolean;
  id: string;
  name: string;
}

export class UpdateAbsenceReason {
  constructor(private readonly repo: AbsenceReasonRepository) {}

  async execute(cmd: UpdateAbsenceReasonCommand): Promise<Result<AbsenceReason, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra los motivos"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Motivo inexistente"));
    const byName = await this.repo.findByName(cmd.name);
    if (byName && byName.id !== cmd.id)
      return err(new DomainError("NAME_TAKEN", "Ya existe un motivo con ese nombre"));
    found.rename(cmd.name);
    return ok(await this.repo.save(found));
  }
}
