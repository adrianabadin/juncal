import { describe, it, expect, beforeEach } from "vitest";
import { RegisterUser } from "@users/application/use-cases/RegisterUser";
import { InMemoryUserRepository } from "@users/infrastructure/persistence/InMemoryUserRepository";

describe("RegisterUser", () => {
  let repo: InMemoryUserRepository;
  beforeEach(() => { repo = new InMemoryUserRepository(); });

  it("crea un usuario inactivo", async () => {
    const uc = new RegisterUser(repo, async (p) => `hash:${p}`);
    const r = await uc.execute({ email: "doc@s.com", password: "secret12", name: "Doc" });
    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.isActive).toBe(false);
      expect(r.value.passwordHash).toBe("hash:secret12");
    }
  });

  it("rechaza email duplicado", async () => {
    const uc = new RegisterUser(repo, async (p) => `hash:${p}`);
    await uc.execute({ email: "doc@s.com", password: "secret12", name: "Doc" });
    const r = await uc.execute({ email: "doc@s.com", password: "secret12", name: "Doc2" });
    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("EMAIL_TAKEN");
  });
});
