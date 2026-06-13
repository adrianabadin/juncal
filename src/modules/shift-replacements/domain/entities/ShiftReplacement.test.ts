import { describe, it, expect } from "vitest";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

const open = () => ShiftReplacement.fromPersistence({
  id: "r1", date: new Date("2026-07-01"), state: RequestState.OPEN,
  requesterId: "u1", specialtyId: "s1", applicantId: null, resolvedById: null,
});

describe("ShiftReplacement state machine", () => {
  it("postular: OPEN → POSTULATED", () => {
    const r = open();
    const res = r.postulate("u2");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.POSTULATED);
    expect(r.applicantId).toBe("u2");
  });

  it("no se puede postular dos veces", () => {
    const r = open();
    r.postulate("u2");
    const res = r.postulate("u3");
    expect(res.isOk).toBe(false);
  });

  it("rechazar postulación: POSTULATED → OPEN, limpia postulante", () => {
    const r = open();
    r.postulate("u2");
    const res = r.rejectPostulation("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.OPEN);
    expect(r.applicantId).toBeNull();
  });

  it("confirmar: POSTULATED → CONFIRMED", () => {
    const r = open();
    r.postulate("u2");
    const res = r.confirm("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.CONFIRMED);
    expect(r.resolvedById).toBe("coord");
  });

  it("no se puede confirmar un OPEN", () => {
    const r = open();
    const res = r.confirm("coord");
    expect(res.isOk).toBe(false);
  });

  it("rechazar solicitud: OPEN/POSTULATED → REJECTED (terminal)", () => {
    const r = open();
    const res = r.rejectRequest("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.REJECTED);
  });

  it("no se puede actuar sobre un estado terminal", () => {
    const r = open();
    r.rejectRequest("coord");
    expect(r.postulate("u2").isOk).toBe(false);
  });
});