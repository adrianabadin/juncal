import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";
import { UserRepository } from "@users/domain/ports/UserRepository";
import { RegisterUserInput } from "@users/domain/schemas/user.schema";

export type PasswordHasher = (plain: string) => Promise<string>;

export class RegisterUser {
  constructor(
    private readonly repo: UserRepository,
    private readonly hash: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<Result<User, DomainError>> {
    const existing = await this.repo.findByEmail(input.email.toLowerCase());
    if (existing)
      return err(new DomainError("EMAIL_TAKEN", "El email ya está registrado"));

    const passwordHash = await this.hash(input.password);
    const user = await this.repo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: Role.BASE_PROFESSIONAL,
    });
    return ok(user);
  }
}
