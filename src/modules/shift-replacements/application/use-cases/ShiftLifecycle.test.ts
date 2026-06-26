import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryShiftReplacementRepository } from "@shift-replacements/infrastructure/persistence/InMemoryShiftReplacementRepository";
import { InMemoryAbsenceReasonRepository } from "@absence-reasons/infrastructure/persistence/InMemoryAbsenceReasonRepository";
import { RequestAbsence } from "@shift-replacements/application/use-cases/RequestAbsence";
import { PostulateForReplacement } from "@shift-replacements/application/use-cases/PostulateForReplacement";
import { ResolveRequest } from "@shift-replacements/application/use-cases/ResolveRequest";
import { AssignCompulsoryCoverage } from "@shift-replacements/application/use-cases/AssignCompulsoryCoverage";
import { RemoveCoverage } from "@shift-replacements/application/use-cases/RemoveCoverage";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";

const hasSpecialty = async (userId: string, specialtyId: string) =>
  specialtyId === "s1" && (userId === "req" || userId === "app" || userId === "app2");

const shiftStart = new Date("2026-07-01T08:00:00");
const shiftEnd = new Date("2026-07-01T20:00:00");
const covStart = new Date("2026-07-01T08:00:00");
const covEnd = new Date("2026-07-01T14:00:00");

describe("Shift lifecycle (coverage model)", () => {
  let repo: InMemoryShiftReplacementRepository;
  let reasons: InMemoryAbsenceReasonRepository;
  let motivoId: string;
  let requestAbsence: RequestAbsence;

  beforeEach(async () => {
    repo = new InMemoryShiftReplacementRepository();
    reasons = new InMemoryAbsenceReasonRepository();
    const enfermedad = await reasons.create({ name: "Enfermedad", isDefault: true });
    motivoId = enfermedad.id;
    requestAbsence = new RequestAbsence(repo, hasSpecialty, reasons);
  });

  it("flujo completo: request → postulate → confirm", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    expect(created.isOk).toBe(true);
    if (!created.isOk) return;

    const post = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
      start: covStart, end: covEnd,
    });
    expect(post.isOk).toBe(true);
    if (!post.isOk) return;
    expect(post.value.origin).toBe(CoverageOrigin.POSTULATION);

    const conf = await new ResolveRequest(repo).execute({
      shiftId: created.value.id, action: "CONFIRM", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(conf.isOk).toBe(true);
    if (conf.isOk) expect(conf.value.state).toBe(RequestState.CONFIRMED);
  });

  it("rechazar solicitud cierra el flujo", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;
    const rej = await new ResolveRequest(repo).execute({
      shiftId: created.value.id, action: "REJECT_REQUEST", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(rej.isOk).toBe(true);
    if (rej.isOk) expect(rej.value.state).toBe(RequestState.REJECTED);
  });

  it("no se puede solicitar sin especialidad", async () => {
    const r = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s2",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    expect(r.isOk).toBe(false);
  });

  it("no se puede solicitar con módulo inválido", async () => {
    const r = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 8, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    expect(r.isOk).toBe(false);
  });

  it("no se puede postular a solicitud cerrada", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;
    await new ResolveRequest(repo).execute({
      shiftId: created.value.id, action: "CONFIRM", coordinatorId: "coord", actorIsCoordinator: true,
    });
    const post = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
      start: covStart, end: covEnd,
    });
    expect(post.isOk).toBe(false);
  });

  it("no se puede postular a solicitud propia", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;
    const post = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "req", isActive: true,
      start: covStart, end: covEnd,
    });
    expect(post.isOk).toBe(false);
  });

  it("reemplazo compulsivo crea cobertura COMPULSORY", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;

    const cov = await new AssignCompulsoryCoverage(repo).execute({
      actorIsCoordinator: true, shiftId: created.value.id,
      applicantId: "app2", start: covStart, end: covEnd,
    });
    expect(cov.isOk).toBe(true);
    if (cov.isOk) {
      expect(cov.value.origin).toBe(CoverageOrigin.COMPULSORY);
      expect(cov.value.applicantId).toBe("app2");
    }
  });

  it("remove coverage elimina una cobertura", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;

    const cov = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
      start: covStart, end: covEnd,
    });
    if (!cov.isOk) return;

    const rem = await new RemoveCoverage(repo).execute({
      actorIsCoordinator: true, coverageId: cov.value.id,
    });
    expect(rem.isOk).toBe(true);

    const coverages = await repo.listCoverages(created.value.id);
    expect(coverages).toHaveLength(0);
  });

  it("coordinador puede confirmar con huecos sin cubrir", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 24, requesterStart: new Date("2026-07-01T00:00:00"),
      requesterEnd: new Date("2026-07-02T00:00:00"),
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;

    // Solo cubre 6h de 24h
    await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
      start: new Date("2026-07-01T08:00:00"),
      end: new Date("2026-07-01T14:00:00"),
    });

    // Coordinador confirma de todas formas
    const conf = await new ResolveRequest(repo).execute({
      shiftId: created.value.id, action: "CONFIRM", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(conf.isOk).toBe(true);
    if (conf.isOk) expect(conf.value.state).toBe(RequestState.CONFIRMED);
  });

  it("no-coordinador no puede confirmar", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;
    const conf = await new ResolveRequest(repo).execute({
      shiftId: created.value.id, action: "CONFIRM", coordinatorId: "req", actorIsCoordinator: false,
    });
    expect(conf.isOk).toBe(false);
  });

  it("no-coordinador no puede asignar compulsivo", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;
    const cov = await new AssignCompulsoryCoverage(repo).execute({
      actorIsCoordinator: false, shiftId: created.value.id,
      applicantId: "app", start: covStart, end: covEnd,
    });
    expect(cov.isOk).toBe(false);
  });

  it("no se puede postular dos veces al mismo shift", async () => {
    const created = await requestAbsence.execute({
      requesterId: "req", isActive: true, specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: motivoId, observation: null,
    });
    if (!created.isOk) return;
    await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
      start: covStart, end: covEnd,
    });
    const dup = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
      start: new Date("2026-07-01T14:00:00"), end: new Date("2026-07-01T20:00:00"),
    });
    expect(dup.isOk).toBe(false);
  });
});
