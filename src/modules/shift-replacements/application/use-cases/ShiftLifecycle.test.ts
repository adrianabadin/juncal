import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryShiftReplacementRepository } from "@shift-replacements/infrastructure/persistence/InMemoryShiftReplacementRepository";
import { RequestAbsence } from "@shift-replacements/application/use-cases/RequestAbsence";
import { PostulateForReplacement } from "@shift-replacements/application/use-cases/PostulateForReplacement";
import { ResolveReplacement } from "@shift-replacements/application/use-cases/ResolveReplacement";
import { AssignCompulsoryReplacement } from "@shift-replacements/application/use-cases/AssignCompulsoryReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

const hasSpecialty = async (userId: string, specialtyId: string) =>
  specialtyId === "s1" && (userId === "req" || userId === "app");

describe("Shift lifecycle", () => {
  let repo: InMemoryShiftReplacementRepository;
  beforeEach(() => { repo = new InMemoryShiftReplacementRepository(); });

  it("flujo OPEN → POSTULATED → CONFIRMED", async () => {
    const created = await new RequestAbsence(repo, hasSpecialty).execute({
      requesterId: "req", isActive: true, date: new Date("2026-07-01"), specialtyId: "s1",
    });
    expect(created.isOk).toBe(true);
    if (!created.isOk) return;

    const post = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
    });
    expect(post.isOk).toBe(true);

    const conf = await new ResolveReplacement(repo).execute({
      shiftId: created.value.id, action: "CONFIRM", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(conf.isOk).toBe(true);
    if (conf.isOk) expect(conf.value.state).toBe(RequestState.CONFIRMED);
  });

  it("rechazar solicitud cierra el flujo", async () => {
    const created = await new RequestAbsence(repo, hasSpecialty).execute({
      requesterId: "req", isActive: true, date: new Date("2026-07-01"), specialtyId: "s1",
    });
    if (!created.isOk) return;
    const rej = await new ResolveReplacement(repo).execute({
      shiftId: created.value.id, action: "REJECT_REQUEST", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(rej.isOk).toBe(true);
    if (rej.isOk) expect(rej.value.state).toBe(RequestState.REJECTED);
  });

  it("no se puede solicitar para una especialidad que no poseés", async () => {
    const r = await new RequestAbsence(repo, hasSpecialty).execute({
      requesterId: "req", isActive: true, date: new Date("2026-07-01"), specialtyId: "s2",
    });
    expect(r.isOk).toBe(false);
  });

  it("reemplazo compulsivo nace CONFIRMED", async () => {
    const r = await new AssignCompulsoryReplacement(repo).execute({
      actorIsCoordinator: true, coordinatorId: "coord",
      date: new Date("2026-07-01"), specialtyId: "s1", requesterId: "req", applicantId: "app",
    });
    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.state).toBe(RequestState.CONFIRMED);
  });
});
