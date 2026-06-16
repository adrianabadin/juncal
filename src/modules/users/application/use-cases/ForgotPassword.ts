import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { UserRepository } from "@users/domain/ports/UserRepository";
import crypto from "crypto";

export class ForgotPassword {
  constructor(private readonly repo: UserRepository) {}

  async execute(email: string): Promise<Result<{ token: string }, DomainError>> {
    const user = await this.repo.findByEmail(email);
    if (!user) return ok({ token: "" });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.repo.createPasswordResetToken({
      token,
      userId: user.id,
      expiresAt,
    });

    return ok({ token });
  }
}
