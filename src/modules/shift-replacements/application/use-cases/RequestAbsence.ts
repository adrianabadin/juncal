import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { isShiftModule } from "@shift-replacements/domain/enums/ShiftModule";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import { AbsenceReasonRepository } from "@absence-reasons/domain/ports/AbsenceReasonRepository";
import { resolveMotivo } from "@shift-replacements/application/use-cases/resolveMotivo";

export type HasSpecialty = (
  userId: string,
  specialtyId: string,
) => Promise<boolean>;

export interface RequestAbsenceCommand {
  requesterId: string;
  isActive: boolean;
  specialtyId: string;
  moduleHours: number;
  requesterStart: Date;
  requesterEnd: Date;
  absenceReasonId: string;
  observation: string | null;
  bajoFactura: boolean;
}

export class RequestAbsence {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly hasSpecialty: HasSpecialty,
    private readonly reasons: AbsenceReasonRepository,
  ) {}

  async execute(
    cmd: RequestAbsenceCommand,
  ): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.isActive)
      return err(new DomainError("INACTIVE_USER", "Tu cuenta no está activa"));
    if (!isShiftModule(cmd.moduleHours))
      return err(
        new DomainError("INVALID_MODULE", "El módulo debe ser de 6, 12 o 24 horas"),
      );
    if (cmd.requesterEnd <= cmd.requesterStart)
      return err(
        new DomainError("INVALID_WINDOW", "La salida debe ser posterior a la entrada"),
      );
    if (!(await this.hasSpecialty(cmd.requesterId, cmd.specialtyId)))
      return err(
        new DomainError("SPECIALTY_NOT_OWNED", "No tenés esa especialidad asignada"),
      );

    const motivo = await resolveMotivo(
      this.reasons,
      cmd.absenceReasonId,
      cmd.observation,
    );
    if (!motivo.isOk) return err(motivo.error);

    const created = await this.repo.create({
      date: cmd.requesterStart,
      requesterId: cmd.requesterId,
      specialtyId: cmd.specialtyId,
      moduleHours: cmd.moduleHours,
      requesterStart: cmd.requesterStart,
      requesterEnd: cmd.requesterEnd,
      state: RequestState.OPEN,
      resolvedById: null,
      absenceReasonId: motivo.value.absenceReasonId,
      observation: motivo.value.observation,
      bajoFactura: cmd.bajoFactura,
    });
    return ok(created);
  }
}
