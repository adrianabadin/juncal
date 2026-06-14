import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";
import { UserRepository } from "@users/domain/ports/UserRepository";

export interface ChangeUserRoleCommand {
  actorIsCoordinator: boolean;
  actorId: string;
  userId: string;
  role: Role;
}

export class ChangeUserRole {
  constructor(private readonly repo: UserRepository) {}

  async execute(
    cmd: ChangeUserRoleCommand,
  ): Promise<Result<User, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(
        new DomainError("FORBIDDEN", "Solo el coordinador gestiona roles"),
      );
    if (cmd.actorId === cmd.userId)
      return err(
        new DomainError(
          "CANNOT_CHANGE_OWN_ROLE",
          "No podés cambiar tu propio rol",
        ),
      );

    const user = await this.repo.findById(cmd.userId);
    if (!user)
      return err(new DomainError("USER_NOT_FOUND", "Usuario inexistente"));
    if (!user.isActive)
      return err(
        new DomainError(
          "USER_INACTIVE",
          "El usuario debe estar activo para cambiar su rol",
        ),
      );

    const updated = await this.repo.setRole(cmd.userId, cmd.role);
    return ok(updated);
  }
}
