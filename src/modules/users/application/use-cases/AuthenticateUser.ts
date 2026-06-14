import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { User } from "@users/domain/entities/User";
import { UserRepository } from "@users/domain/ports/UserRepository";

export type PasswordVerifier = (plain: string, hash: string) => Promise<boolean>;

export interface AuthenticateCommand {
  email: string;
  password: string;
}

export class AuthenticateUser {
  constructor(
    private readonly repo: UserRepository,
    private readonly verify: PasswordVerifier,
  ) {}

  async execute(cmd: AuthenticateCommand): Promise<Result<User, DomainError>> {
    const user = await this.repo.findByEmail(cmd.email.toLowerCase());
    if (!user) {
      return err(new DomainError("INVALID_CREDENTIALS", "Email o contraseña inválidos"));
    }

    const valid = await this.verify(cmd.password, user.passwordHash);
    if (!valid) {
      return err(new DomainError("INVALID_CREDENTIALS", "Email o contraseña inválidos"));
    }

    return ok(user);
  }
}
