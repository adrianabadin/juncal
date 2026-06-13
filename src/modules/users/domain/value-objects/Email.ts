import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email, DomainError> {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized))
      return err(new DomainError("INVALID_EMAIL", `Email inválido: ${raw}`));
    return ok(new Email(normalized));
  }
}