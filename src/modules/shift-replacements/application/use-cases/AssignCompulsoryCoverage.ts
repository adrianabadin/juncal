import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export interface AssignCompulsoryCoverageCommand {
  actorIsCoordinator: boolean;
  shiftId: string;
  applicantId: string;
  start: Date;
  end: Date;
}

// El coordinador cubre compulsivamente un tramo (típicamente el que falta) de
// una solicitud abierta.
export class AssignCompulsoryCoverage {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(
    cmd: AssignCompulsoryCoverageCommand,
  ): Promise<Result<ShiftCoverage, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(
        new DomainError("FORBIDDEN", "Solo el coordinador asigna compulsivos"),
      );
    if (cmd.end <= cmd.start)
      return err(
        new DomainError("INVALID_WINDOW", "La salida debe ser posterior a la entrada"),
      );

    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift)
      return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));
    if (!shift.isOpen)
      return err(
        new DomainError("SHIFT_NOT_OPEN", "La solicitud ya está cerrada"),
      );

    const overlapping = await this.repo.findOverlappingCoverages(
      cmd.applicantId,
      cmd.start,
      cmd.end,
    );
    if (overlapping.length > 0)
      return err(
        new DomainError("DUPLICATE_COVERAGE", "Reemplazo duplicado: ya tenés una cobertura en ese período"),
      );

    const coverage = await this.repo.addCoverage({
      shiftReplacementId: shift.id,
      applicantId: cmd.applicantId,
      start: cmd.start,
      end: cmd.end,
      origin: CoverageOrigin.COMPULSORY,
    });
    return ok(coverage);
  }
}
