import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { Specialty } from "@specialties/domain/entities/Specialty";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export interface UpdateSpecialtyCommand {
  actorIsCoordinator: boolean;
  id: string;
  name: string;
  description?: string;
}

export class UpdateSpecialty {
  constructor(private readonly repo: SpecialtyRepository) {}
  async execute(cmd: UpdateSpecialtyCommand): Promise<Result<Specialty, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra especialidades"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Especialidad inexistente"));
    const byName = await this.repo.findByName(cmd.name);
    if (byName && byName.id !== cmd.id)
      return err(new DomainError("NAME_TAKEN", "Ya existe una especialidad con ese nombre"));
    found.rename(cmd.name);
    found.updateDescription(cmd.description ?? null);
    return ok(await this.repo.save(found));
  }
}
