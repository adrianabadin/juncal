import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { UserRepository } from "@users/domain/ports/UserRepository";

export interface UpdateSpecialtiesCommand {
  actorIsCoordinator: boolean;
  userId: string;
  specialtyIds: string[];
}

export class UpdateUserSpecialties {
  constructor(private readonly repo: UserRepository) {}

  async execute(cmd: UpdateSpecialtiesCommand): Promise<Result<void, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador puede editar especialidades"));

    const user = await this.repo.findById(cmd.userId);
    if (!user) return err(new DomainError("USER_NOT_FOUND", "Usuario inexistente"));
    if (!user.isActive)
      return err(new DomainError("USER_INACTIVE", "El usuario debe estar activo"));

    await this.repo.updateSpecialties(cmd.userId, cmd.specialtyIds);
    return ok(undefined);
  }
}
