import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export interface DeleteSpecialtyCommand { actorIsCoordinator: boolean; id: string; }

export class DeleteSpecialty {
  constructor(private readonly repo: SpecialtyRepository) {}
  async execute(cmd: DeleteSpecialtyCommand): Promise<Result<void, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra especialidades"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Especialidad inexistente"));
    await this.repo.delete(cmd.id);
    return ok(undefined);
  }
}
