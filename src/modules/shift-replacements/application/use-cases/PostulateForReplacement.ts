import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import { HasSpecialty } from "@shift-replacements/application/use-cases/RequestAbsence";

export interface PostulateCommand {
  shiftId: string;
  applicantId: string;
  isActive: boolean;
}

export class PostulateForReplacement {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly hasSpecialty: HasSpecialty,
  ) {}

  async execute(cmd: PostulateCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.isActive)
      return err(new DomainError("INACTIVE_USER", "Tu cuenta no está activa"));
    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift) return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));
    if (!(await this.hasSpecialty(cmd.applicantId, shift.specialtyId)))
      return err(new DomainError("SPECIALTY_NOT_OWNED", "No tenés la especialidad requerida"));

    const transition = shift.postulate(cmd.applicantId);
    if (!transition.isOk) return err(transition.error);

    return ok(await this.repo.save(shift));
  }
}
