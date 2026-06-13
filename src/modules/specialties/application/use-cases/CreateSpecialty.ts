import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { Specialty } from "@specialties/domain/entities/Specialty";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export interface CreateSpecialtyCommand {
  actorIsCoordinator: boolean;
  name: string;
  description?: string;
}

export class CreateSpecialty {
  constructor(private readonly repo: SpecialtyRepository) {}

  async execute(cmd: CreateSpecialtyCommand): Promise<Result<Specialty, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra especialidades"));
    if (await this.repo.findByName(cmd.name))
      return err(new DomainError("NAME_TAKEN", "Ya existe una especialidad con ese nombre"));

    const created = await this.repo.create({ name: cmd.name, description: cmd.description ?? null });
    return ok(created);
  }
}
