import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryAbsenceReasonRepository } from "@absence-reasons/infrastructure/persistence/InMemoryAbsenceReasonRepository";
import { CreateAbsenceReason } from "@absence-reasons/application/use-cases/CreateAbsenceReason";
import { UpdateAbsenceReason } from "@absence-reasons/application/use-cases/UpdateAbsenceReason";
import { DeactivateAbsenceReason } from "@absence-reasons/application/use-cases/DeactivateAbsenceReason";
import { DeleteAbsenceReason } from "@absence-reasons/application/use-cases/DeleteAbsenceReason";
import { ListAbsenceReasons } from "@absence-reasons/application/use-cases/ListAbsenceReasons";

describe("CreateAbsenceReason", () => {
  let repo: InMemoryAbsenceReasonRepository;
  beforeEach(() => { repo = new InMemoryAbsenceReasonRepository(); });

  it("solo el coordinador crea motivos", async () => {
    const uc = new CreateAbsenceReason(repo);
    const denied = await uc.execute({ actorIsCoordinator: false, name: "Curso" });
    expect(denied.isOk).toBe(false);
    if (!denied.isOk) expect(denied.error.code).toBe("FORBIDDEN");

    const okR = await uc.execute({ actorIsCoordinator: true, name: "Curso" });
    expect(okR.isOk).toBe(true);
    if (okR.isOk) expect(okR.value.name).toBe("Curso");
  });

  it("rechaza nombre duplicado", async () => {
    const uc = new CreateAbsenceReason(repo);
    await uc.execute({ actorIsCoordinator: true, name: "Congreso" });
    const dup = await uc.execute({ actorIsCoordinator: true, name: "Congreso" });
    expect(dup.isOk).toBe(false);
    if (!dup.isOk) expect(dup.error.code).toBe("NAME_TAKEN");
  });
});

describe("UpdateAbsenceReason", () => {
  let repo: InMemoryAbsenceReasonRepository;
  beforeEach(() => { repo = new InMemoryAbsenceReasonRepository(); });

  it("renombra un motivo existente", async () => {
    const created = await new CreateAbsenceReason(repo).execute({ actorIsCoordinator: true, name: "Curso" });
    if (!created.isOk) throw new Error("setup failed");

    const uc = new UpdateAbsenceReason(repo);
    const renamed = await uc.execute({ actorIsCoordinator: true, id: created.value.id, name: "Capacitación" });
    expect(renamed.isOk).toBe(true);
    if (renamed.isOk) expect(renamed.value.name).toBe("Capacitación");
  });

  it("rechaza renombrar a un nombre ya usado por otro motivo", async () => {
    const create = new CreateAbsenceReason(repo);
    await create.execute({ actorIsCoordinator: true, name: "Congreso" });
    const second = await create.execute({ actorIsCoordinator: true, name: "Curso" });
    if (!second.isOk) throw new Error("setup failed");

    const clash = await new UpdateAbsenceReason(repo).execute({
      actorIsCoordinator: true, id: second.value.id, name: "Congreso",
    });
    expect(clash.isOk).toBe(false);
    if (!clash.isOk) expect(clash.error.code).toBe("NAME_TAKEN");
  });
});

describe("DeactivateAbsenceReason", () => {
  let repo: InMemoryAbsenceReasonRepository;
  beforeEach(() => { repo = new InMemoryAbsenceReasonRepository(); });

  it("desactiva un motivo (soft-delete) y desaparece de los activos", async () => {
    const created = await new CreateAbsenceReason(repo).execute({ actorIsCoordinator: true, name: "Curso" });
    if (!created.isOk) throw new Error("setup failed");

    const result = await new DeactivateAbsenceReason(repo).execute({
      actorIsCoordinator: true, id: created.value.id,
    });
    expect(result.isOk).toBe(true);

    const active = await repo.listActive();
    expect(active).toHaveLength(0);
    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0].isActive).toBe(false);
  });
});

describe("DeleteAbsenceReason", () => {
  let repo: InMemoryAbsenceReasonRepository;
  beforeEach(() => { repo = new InMemoryAbsenceReasonRepository(); });

  it("borra un motivo personalizado", async () => {
    const created = await new CreateAbsenceReason(repo).execute({ actorIsCoordinator: true, name: "Curso" });
    if (!created.isOk) throw new Error("setup failed");

    const result = await new DeleteAbsenceReason(repo).execute({
      actorIsCoordinator: true, id: created.value.id,
    });
    expect(result.isOk).toBe(true);
    expect(await repo.list()).toHaveLength(0);
  });

  it("bloquea el borrado de un motivo por defecto", async () => {
    const reason = await repo.create({ name: "Otros", isDefault: true });

    const result = await new DeleteAbsenceReason(repo).execute({
      actorIsCoordinator: true, id: reason.id,
    });
    expect(result.isOk).toBe(false);
    if (!result.isOk) expect(result.error.code).toBe("DEFAULT_PROTECTED");
    expect(await repo.list()).toHaveLength(1);
  });
});

describe("ListAbsenceReasons", () => {
  it("devuelve todos los motivos", async () => {
    const repo = new InMemoryAbsenceReasonRepository();
    await repo.create({ name: "Congreso", isDefault: true });
    await repo.create({ name: "Curso" });

    const reasons = await new ListAbsenceReasons(repo).execute();
    expect(reasons.map((r) => r.name)).toEqual(["Congreso", "Curso"]);
  });
});
