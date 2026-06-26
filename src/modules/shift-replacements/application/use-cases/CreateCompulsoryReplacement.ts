import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";
import { isShiftModule } from "@shift-replacements/domain/enums/ShiftModule";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";
import { resolveMotivo } from "@shift-replacements/application/use-cases/resolveMotivo";

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
  absenceReasonId: string;
  observation: string | null;
}

// El coordinador crea una solicitud de ausencia + cobertura compulsiva + la
// confirma, todo en un solo paso. La solicitud nace directamente en CONFIRMED.
export class CreateCompulsoryReplacement {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly reasons: AbsenceReasonRepository,
  ) {}

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

    const motivo = await resolveMotivo(
      this.reasons,
      cmd.absenceReasonId,
      cmd.observation,
    );
    if (!motivo.isOk) return err(motivo.error);

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
      absenceReasonId: motivo.value.absenceReasonId,
      observation: motivo.value.observation,
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
