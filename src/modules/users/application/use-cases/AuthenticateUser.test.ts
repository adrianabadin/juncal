import { describe, it, expect, beforeEach } from "vitest";
import { AuthenticateUser } from "@users/application/use-cases/AuthenticateUser";
import { InMemoryUserRepository } from "@users/infrastructure/persistence/InMemoryUserRepository";
import { Role } from "@users/domain/enums/Role";

describe("AuthenticateUser", () => {
  let repo: InMemoryUserRepository;

  beforeEach(async () => {
    repo = new InMemoryUserRepository();
    await repo.create({
      email: "doc@hospital.com",
      passwordHash: "hash:secret12",
      name: "Dra. García",
      role: Role.BASE_PROFESSIONAL,
    });
  });

  it("retorna el usuario cuando las credenciales son correctas", async () => {
    const uc = new AuthenticateUser(repo, async (plain, hash) => `hash:${plain}` === hash);
    const r = await uc.execute({ email: "doc@hospital.com", password: "secret12" });
    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.email).toBe("doc@hospital.com");
    }
  });

  it("rechaza contraseña incorrecta con INVALID_CREDENTIALS", async () => {
    const uc = new AuthenticateUser(repo, async (plain, hash) => `hash:${plain}` === hash);
    const r = await uc.execute({ email: "doc@hospital.com", password: "wrong-password" });
    expect(r.isOk).toBe(false);
    if (!r.isOk) {
      expect(r.error.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("rechaza email desconocido con INVALID_CREDENTIALS (sin revelar que no existe)", async () => {
    const uc = new AuthenticateUser(repo, async (plain, hash) => `hash:${plain}` === hash);
    const r = await uc.execute({ email: "noexiste@hospital.com", password: "secret12" });
    expect(r.isOk).toBe(false);
    if (!r.isOk) {
      expect(r.error.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("normaliza el email a minúsculas antes de buscar", async () => {
    const uc = new AuthenticateUser(repo, async (plain, hash) => `hash:${plain}` === hash);
    const r = await uc.execute({ email: "DOC@HOSPITAL.COM", password: "secret12" });
    expect(r.isOk).toBe(true);
  });

  it("permite autenticar a un usuario inactivo y devuelve isActive=false", async () => {
    // Users created via InMemoryUserRepository start with isActive=false (pending activation).
    // AuthenticateUser deliberately does not block them — the UI shows a "pending" state.
    const uc = new AuthenticateUser(repo, async (plain, hash) => `hash:${plain}` === hash);
    const r = await uc.execute({ email: "doc@hospital.com", password: "secret12" });
    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.isActive).toBe(false);
    }
  });
});
