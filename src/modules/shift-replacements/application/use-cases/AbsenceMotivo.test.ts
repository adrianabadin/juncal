import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryShiftReplacementRepository } from "@shift-replacements/infrastructure/persistence/InMemoryShiftReplacementRepository";
import { InMemoryAbsenceReasonRepository } from "@absence-reasons/infrastructure/persistence/InMemoryAbsenceReasonRepository";
import { RequestAbsence } from "@shift-replacements/application/use-cases/RequestAbsence";
import { CreateCompulsoryReplacement } from "@shift-replacements/application/use-cases/CreateCompulsoryReplacement";

const hasSpecialty = async (userId: string, specialtyId: string) =>
  specialtyId === "s1" && (userId === "req" || userId === "app");

const shiftStart = new Date("2026-07-01T08:00:00");
const shiftEnd = new Date("2026-07-01T20:00:00");
const covStart = new Date("2026-07-01T08:00:00");
const covEnd = new Date("2026-07-01T14:00:00");

describe("RequestAbsence — motivo persistence", () => {
  let repo: InMemoryShiftReplacementRepository;
  let reasons: InMemoryAbsenceReasonRepository;

  beforeEach(() => {
    repo = new InMemoryShiftReplacementRepository();
    reasons = new InMemoryAbsenceReasonRepository();
  });

  it("persists absenceReasonId and null observation for a standard reason", async () => {
    const enfermedad = await reasons.create({ name: "Enfermedad", isDefault: true });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: enfermedad.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(enfermedad.id);
      expect(r.value.observation).toBeNull();
    }
  });

  it("persists observation when reason is custom (non-default)", async () => {
    const curso = await reasons.create({ name: "Curso", isDefault: false });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: curso.id, observation: "Trámite personal", bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(curso.id);
      expect(r.value.observation).toBe("Trámite personal");
    }
  });

  it("accepts a custom non-Otros reason without observation", async () => {
    const curso = await reasons.create({ name: "Curso", isDefault: false });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: curso.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(curso.id);
      expect(r.value.observation).toBeNull();
    }
  });

  it("rejects Otros without observation", async () => {
    const otros = await reasons.create({ name: "Otros", isDefault: false });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: otros.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("OBSERVATION_REQUIRED");
  });

  it("accepts Otros with observation", async () => {
    const otros = await reasons.create({ name: "Otros", isDefault: false });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: otros.id, observation: "Trámite personal", bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(otros.id);
      expect(r.value.observation).toBe("Trámite personal");
    }
  });

  it("persists bajoFactura=true when requested", async () => {
    const vacaciones = await reasons.create({ name: "Vacaciones", isDefault: true });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: vacaciones.id, observation: null, bajoFactura: true,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.bajoFactura).toBe(true);
  });

  it("persists bajoFactura=false by default", async () => {
    const vacaciones = await reasons.create({ name: "Vacaciones", isDefault: true });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: vacaciones.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.bajoFactura).toBe(false);
  });

  it("does not require observation for a default reason", async () => {
    const vacaciones = await reasons.create({ name: "Vacaciones", isDefault: true });
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: vacaciones.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.observation).toBeNull();
  });

  it("rejects a non-existent motivo", async () => {
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: "does-not-exist", observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("INVALID_MOTIVO");
  });

  it("rejects an inactive motivo", async () => {
    const curso = await reasons.create({ name: "Curso" });
    curso.deactivate();
    await reasons.save(curso);
    const uc = new RequestAbsence(repo, hasSpecialty, reasons);

    const r = await uc.execute({
      requesterId: "req", isActive: true, specialtyId: "s1", moduleHours: 12,
      requesterStart: shiftStart, requesterEnd: shiftEnd,
      absenceReasonId: curso.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("INVALID_MOTIVO");
  });
});

describe("CreateCompulsoryReplacement — motivo persistence", () => {
  let repo: InMemoryShiftReplacementRepository;
  let reasons: InMemoryAbsenceReasonRepository;

  beforeEach(() => {
    repo = new InMemoryShiftReplacementRepository();
    reasons = new InMemoryAbsenceReasonRepository();
  });

  it("persists absenceReasonId for a standard reason", async () => {
    const vacaciones = await reasons.create({ name: "Vacaciones", isDefault: true });
    const uc = new CreateCompulsoryReplacement(repo, reasons);

    const r = await uc.execute({
      actorIsCoordinator: true, coordinatorId: "coord", specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      requesterId: "req", applicantId: "app",
      coverageStart: covStart, coverageEnd: covEnd,
      absenceReasonId: vacaciones.id, observation: null, bajoFactura: true,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(vacaciones.id);
      expect(r.value.observation).toBeNull();
      expect(r.value.bajoFactura).toBe(true);
    }
  });

  it("accepts a custom non-Otros reason without observation", async () => {
    const curso = await reasons.create({ name: "Curso", isDefault: false });
    const uc = new CreateCompulsoryReplacement(repo, reasons);

    const r = await uc.execute({
      actorIsCoordinator: true, coordinatorId: "coord", specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      requesterId: "req", applicantId: "app",
      coverageStart: covStart, coverageEnd: covEnd,
      absenceReasonId: curso.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(curso.id);
      expect(r.value.observation).toBeNull();
    }
  });

  it("rejects Otros without observation", async () => {
    const otros = await reasons.create({ name: "Otros", isDefault: false });
    const uc = new CreateCompulsoryReplacement(repo, reasons);

    const r = await uc.execute({
      actorIsCoordinator: true, coordinatorId: "coord", specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      requesterId: "req", applicantId: "app",
      coverageStart: covStart, coverageEnd: covEnd,
      absenceReasonId: otros.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("OBSERVATION_REQUIRED");
  });

  it("accepts Otros with observation", async () => {
    const otros = await reasons.create({ name: "Otros", isDefault: false });
    const uc = new CreateCompulsoryReplacement(repo, reasons);

    const r = await uc.execute({
      actorIsCoordinator: true, coordinatorId: "coord", specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      requesterId: "req", applicantId: "app",
      coverageStart: covStart, coverageEnd: covEnd,
      absenceReasonId: otros.id, observation: "Motivo especial", bajoFactura: false,
    });

    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.absenceReasonId).toBe(otros.id);
      expect(r.value.observation).toBe("Motivo especial");
    }
  });

  it("rejects an inactive motivo", async () => {
    const curso = await reasons.create({ name: "Curso" });
    curso.deactivate();
    await reasons.save(curso);
    const uc = new CreateCompulsoryReplacement(repo, reasons);

    const r = await uc.execute({
      actorIsCoordinator: true, coordinatorId: "coord", specialtyId: "s1",
      moduleHours: 12, requesterStart: shiftStart, requesterEnd: shiftEnd,
      requesterId: "req", applicantId: "app",
      coverageStart: covStart, coverageEnd: covEnd,
      absenceReasonId: curso.id, observation: null, bajoFactura: false,
    });

    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("INVALID_MOTIVO");
  });
});
