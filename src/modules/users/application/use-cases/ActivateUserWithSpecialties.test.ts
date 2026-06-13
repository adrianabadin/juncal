import { describe, it, expect } from "vitest";
import { ActivateUserWithSpecialties } from "@users/application/use-cases/ActivateUserWithSpecialties";
import { InMemoryUserRepository } from "@users/infrastructure/persistence/InMemoryUserRepository";
import { Role } from "@users/domain/enums/Role";

describe("ActivateUserWithSpecialties", () => {
  it("solo un coordinador activa cuentas", async () => {
    const repo = new InMemoryUserRepository();
    const target = await repo.create({ email: "a@s.com", passwordHash: "h", name: "A", role: Role.BASE_PROFESSIONAL });
    const uc = new ActivateUserWithSpecialties(repo);

    const denied = await uc.execute({ actorIsCoordinator: false, userId: target.id, specialtyIds: ["s1"] });
    expect(denied.isOk).toBe(false);

    const okR = await uc.execute({ actorIsCoordinator: true, userId: target.id, specialtyIds: ["s1"] });
    expect(okR.isOk).toBe(true);
    if (okR.isOk) expect(okR.value.isActive).toBe(true);
  });
});