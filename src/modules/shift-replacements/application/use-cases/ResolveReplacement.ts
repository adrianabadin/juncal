import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export type ResolveAction = "CONFIRM" | "REJECT_POSTULATION" | "REJECT_REQUEST";

export interface ResolveCommand {
  shiftId: string;
  action: ResolveAction;
  coordinatorId: string;
  actorIsCoordinator: boolean;
}

export class ResolveReplacement {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(cmd: ResolveCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador resuelve reemplazos"));
    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift) return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));

    const transition =
      cmd.action === "CONFIRM" ? shift.confirm(cmd.coordinatorId)
      : cmd.action === "REJECT_POSTULATION" ? shift.rejectPostulation(cmd.coordinatorId)
      : shift.rejectRequest(cmd.coordinatorId);

    if (!transition.isOk) return err(transition.error);
    return ok(await this.repo.save(shift));
  }
}
