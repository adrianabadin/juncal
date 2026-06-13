import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySpecialtyRepository } from "@specialties/infrastructure/persistence/InMemorySpecialtyRepository";
import { CreateSpecialty } from "@specialties/application/use-cases/CreateSpecialty";

describe("CreateSpecialty", () => {
  let repo: InMemorySpecialtyRepository;
  beforeEach(() => { repo = new InMemorySpecialtyRepository(); });

  it("solo el coordinador crea especialidades", async () => {
    const uc = new CreateSpecialty(repo);
    const denied = await uc.execute({ actorIsCoordinator: false, name: "Pediatría" });
    expect(denied.isOk).toBe(false);
    const okR = await uc.execute({ actorIsCoordinator: true, name: "Pediatría" });
    expect(okR.isOk).toBe(true);
  });

  it("rechaza nombre duplicado", async () => {
    const uc = new CreateSpecialty(repo);
    await uc.execute({ actorIsCoordinator: true, name: "Clínica" });
    const dup = await uc.execute({ actorIsCoordinator: true, name: "Clínica" });
    expect(dup.isOk).toBe(false);
    if (!dup.isOk) expect(dup.error.code).toBe("NAME_TAKEN");
  });
});
