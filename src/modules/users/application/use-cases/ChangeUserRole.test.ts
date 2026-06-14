import { describe, it, expect, beforeEach } from "vitest";
import { ChangeUserRole } from "@users/application/use-cases/ChangeUserRole";
import { InMemoryUserRepository } from "@users/infrastructure/persistence/InMemoryUserRepository";
import { Role } from "@users/domain/enums/Role";

describe("ChangeUserRole", () => {
  let repo: InMemoryUserRepository;
  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  it("un coordinador promueve a otro usuario activo a COORDINATOR", async () => {
    const target = await repo.create({
      email: "a@s.com",
      passwordHash: "h",
      name: "A",
      role: Role.BASE_PROFESSIONAL,
    });
    await repo.activateWithSpecialties(target.id, ["s1"]);

    const uc = new ChangeUserRole(repo);
    const res = await uc.execute({
      actorIsCoordinator: true,
      actorId: "coord",
      userId: target.id,
      role: Role.COORDINATOR,
    });

    expect(res.isOk).toBe(true);
    if (res.isOk) expect(res.value.role).toBe(Role.COORDINATOR);
  });

  it("rechaza si el actor no es coordinador", async () => {
    const target = await repo.create({
      email: "a@s.com",
      passwordHash: "h",
      name: "A",
      role: Role.BASE_PROFESSIONAL,
    });
    await repo.activateWithSpecialties(target.id, ["s1"]);

    const uc = new ChangeUserRole(repo);
    const res = await uc.execute({
      actorIsCoordinator: false,
      actorId: "coord",
      userId: target.id,
      role: Role.COORDINATOR,
    });
    expect(res.isOk).toBe(false);
    if (!res.isOk) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("no permite cambiar el propio rol", async () => {
    const me = await repo.create({
      email: "me@s.com",
      passwordHash: "h",
      name: "Me",
      role: Role.COORDINATOR,
    });
    await repo.activateWithSpecialties(me.id, ["s1"]);

    const uc = new ChangeUserRole(repo);
    const res = await uc.execute({
      actorIsCoordinator: true,
      actorId: me.id,
      userId: me.id,
      role: Role.BASE_PROFESSIONAL,
    });
    expect(res.isOk).toBe(false);
    if (!res.isOk) expect(res.error.code).toBe("CANNOT_CHANGE_OWN_ROLE");
  });

  it("no permite cambiar el rol de un usuario inactivo", async () => {
    const target = await repo.create({
      email: "a@s.com",
      passwordHash: "h",
      name: "A",
      role: Role.BASE_PROFESSIONAL,
    });

    const uc = new ChangeUserRole(repo);
    const res = await uc.execute({
      actorIsCoordinator: true,
      actorId: "coord",
      userId: target.id,
      role: Role.COORDINATOR,
    });
    expect(res.isOk).toBe(false);
    if (!res.isOk) expect(res.error.code).toBe("USER_INACTIVE");
  });
});
