import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { AbsenceReason } from "@absence-reasons/domain/entities/AbsenceReason";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";

export interface CreateAbsenceReasonCommand {
  actorIsCoordinator: boolean;
  name: string;
}

export class CreateAbsenceReason {
  constructor(private readonly repo: AbsenceReasonRepository) {}

  async execute(cmd: CreateAbsenceReasonCommand): Promise<Result<AbsenceReason, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra los motivos"));
    if (await this.repo.findByName(cmd.name))
      return err(new DomainError("NAME_TAKEN", "Ya existe un motivo con ese nombre"));

    const created = await this.repo.create({ name: cmd.name });
    return ok(created);
  }
}
