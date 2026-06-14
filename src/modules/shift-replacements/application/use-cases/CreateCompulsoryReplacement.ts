import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";
import { isShiftModule } from "@shift-replacements/domain/enums/ShiftModule";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export interface CreateCompulsoryCommand {
  actorIsCoordinator: boolean;
  coordinatorId: string;
  specialtyId: string;
  moduleHours: number;
  requesterStart: Date;
  requesterEnd: Date;
  requesterId: string;
  applicantId: string;
  coverageStart: Date;
  coverageEnd: Date;
}

// El coordinador crea una solicitud de ausencia + cobertura compulsiva + la
// confirma, todo en un solo paso. La solicitud nace directamente en CONFIRMED.
export class CreateCompulsoryReplacement {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(
    cmd: CreateCompulsoryCommand,
  ): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(
        new DomainError("FORBIDDEN", "Solo el coordinador puede crear reemplazos compulsivos"),
      );
    if (!isShiftModule(cmd.moduleHours))
      return err(
        new DomainError("INVALID_MODULE", "El módulo debe ser de 6, 12 o 24 horas"),
      );
    if (cmd.requesterEnd <= cmd.requesterStart)
      return err(
        new DomainError("INVALID_WINDOW", "La salida debe ser posterior a la entrada"),
      );
    if (cmd.coverageEnd <= cmd.coverageStart)
      return err(
        new DomainError("INVALID_COVERAGE_WINDOW", "La salida de la cobertura debe ser posterior a la entrada"),
      );
    if (cmd.applicantId === cmd.requesterId)
      return err(
        new DomainError("SELF_REPLACEMENT", "El reemplazante no puede ser el mismo que el ausente"),
      );

    // Crear la solicitud directamente en CONFIRMED
    const shift = await this.repo.create({
      date: cmd.requesterStart,
      requesterId: cmd.requesterId,
      specialtyId: cmd.specialtyId,
      moduleHours: cmd.moduleHours,
      requesterStart: cmd.requesterStart,
      requesterEnd: cmd.requesterEnd,
      state: RequestState.CONFIRMED,
      resolvedById: cmd.coordinatorId,
    });

    // Agregar la cobertura compulsiva
    await this.repo.addCoverage({
      shiftReplacementId: shift.id,
      applicantId: cmd.applicantId,
      start: cmd.coverageStart,
      end: cmd.coverageEnd,
      origin: CoverageOrigin.COMPULSORY,
    });

    return ok(shift);
  }
}
