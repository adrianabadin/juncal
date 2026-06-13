import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export interface AssignCompulsoryCommand {
  actorIsCoordinator: boolean;
  coordinatorId: string;
  date: Date;
  specialtyId: string;
  requesterId: string;
  applicantId: string;
}

export class AssignCompulsoryReplacement {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(cmd: AssignCompulsoryCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador asigna compulsivos"));

    const created = await this.repo.create({
      date: cmd.date, requesterId: cmd.requesterId, specialtyId: cmd.specialtyId,
      applicantId: cmd.applicantId, state: RequestState.CONFIRMED, resolvedById: cmd.coordinatorId,
    });
    return ok(created);
  }
}
