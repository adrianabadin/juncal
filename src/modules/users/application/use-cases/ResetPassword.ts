import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { UserRepository } from "@users/domain/ports/UserRepository";

export type PasswordHasher = (plain: string) => Promise<string>;

export class ResetPassword {
  constructor(
    private readonly repo: UserRepository,
    private readonly hashPassword: PasswordHasher,
  ) {}

  async execute(token: string, newPassword: string): Promise<Result<void, DomainError>> {
    const tokenData = await this.repo.findPasswordResetToken(token);
    if (!tokenData) return err(new DomainError("INVALID_TOKEN", "Token inválido o expirado"));
    if (tokenData.used) return err(new DomainError("TOKEN_USED", "Este token ya fue utilizado"));
    if (tokenData.expiresAt < new Date()) return err(new DomainError("TOKEN_EXPIRED", "Token expirado"));

    const hash = await this.hashPassword(newPassword);
    await this.repo.updatePassword(tokenData.userId, hash);
    await this.repo.markPasswordResetTokenUsed(token);

    return ok(undefined);
  }
}
