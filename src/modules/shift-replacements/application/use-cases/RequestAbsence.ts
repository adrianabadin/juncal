import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { isShiftModule } from "@shift-replacements/domain/enums/ShiftModule";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

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
<<<<<<< Updated upstream
=======
  absenceReasonId: string;
  observation: string | null;
  bajoFactura: boolean;
>>>>>>> Stashed changes
}

export class RequestAbsence {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly hasSpecialty: HasSpecialty,
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

    const created = await this.repo.create({
      date: cmd.requesterStart,
      requesterId: cmd.requesterId,
      specialtyId: cmd.specialtyId,
      moduleHours: cmd.moduleHours,
      requesterStart: cmd.requesterStart,
      requesterEnd: cmd.requesterEnd,
      state: RequestState.OPEN,
      resolvedById: null,
<<<<<<< Updated upstream
=======
      absenceReasonId: motivo.value.absenceReasonId,
      observation: motivo.value.observation,
      bajoFactura: cmd.bajoFactura,
>>>>>>> Stashed changes
    });
    return ok(created);
  }
}
