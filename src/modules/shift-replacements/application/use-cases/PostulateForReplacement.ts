import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import { HasSpecialty } from "@shift-replacements/application/use-cases/RequestAbsence";

export interface PostulateCommand {
  shiftId: string;
  applicantId: string;
  isActive: boolean;
  start: Date;
  end: Date;
}

export class PostulateForReplacement {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly hasSpecialty: HasSpecialty,
  ) {}

  async execute(
    cmd: PostulateCommand,
  ): Promise<Result<ShiftCoverage, DomainError>> {
    if (!cmd.isActive)
      return err(new DomainError("INACTIVE_USER", "Tu cuenta no está activa"));
    if (cmd.end <= cmd.start)
      return err(
        new DomainError("INVALID_WINDOW", "La salida debe ser posterior a la entrada"),
      );

    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift)
      return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));
    if (!shift.isOpen)
      return err(
        new DomainError("SHIFT_NOT_OPEN", "La solicitud ya no admite postulaciones"),
      );
    if (cmd.applicantId === shift.requesterId)
      return err(
        new DomainError("SELF_POSTULATION", "No podés postularte a tu propia solicitud"),
      );
    if (!(await this.hasSpecialty(cmd.applicantId, shift.specialtyId)))
      return err(
        new DomainError("SPECIALTY_NOT_OWNED", "No tenés la especialidad requerida"),
      );

    const existing = await this.repo.listCoverages(shift.id);
    if (existing.some((c) => c.applicantId === cmd.applicantId))
      return err(
        new DomainError("ALREADY_POSTULATED", "Ya cubrís un tramo de esta guardia"),
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
      origin: CoverageOrigin.POSTULATION,
    });
    return ok(coverage);
  }
}
