import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { UserRepository } from "@users/domain/ports/UserRepository";

export type PasswordVerifier = (hash: string, plain: string) => Promise<boolean>;
export type PasswordHasher = (plain: string) => Promise<string>;

export class ChangePassword {
  constructor(
    private readonly repo: UserRepository,
    private readonly verifyPassword: PasswordVerifier,
    private readonly hashPassword: PasswordHasher,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<Result<void, DomainError>> {
    const user = await this.repo.findById(userId);
    if (!user) return err(new DomainError("USER_NOT_FOUND", "Usuario no encontrado"));

    const valid = await this.verifyPassword(user.passwordHash, currentPassword);
    if (!valid) return err(new DomainError("INVALID_PASSWORD", "La contraseña actual es incorrecta"));

    const hash = await this.hashPassword(newPassword);
    await this.repo.updatePassword(userId, hash);

    return ok(undefined);
  }
}
