import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { User } from "@users/domain/entities/User";
import { UserRepository } from "@users/domain/ports/UserRepository";

export interface ActivateUserCommand {
  actorIsCoordinator: boolean;
  userId: string;
  specialtyIds: string[];
}

export class ActivateUserWithSpecialties {
  constructor(private readonly repo: UserRepository) {}

  async execute(cmd: ActivateUserCommand): Promise<Result<User, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador puede activar cuentas"));
    if (cmd.specialtyIds.length === 0)
      return err(new DomainError("NO_SPECIALTIES", "Asigná al menos una especialidad"));

    const user = await this.repo.findById(cmd.userId);
    if (!user) return err(new DomainError("USER_NOT_FOUND", "Usuario inexistente"));

    const updated = await this.repo.activateWithSpecialties(cmd.userId, cmd.specialtyIds);
    return ok(updated);
  }
}
