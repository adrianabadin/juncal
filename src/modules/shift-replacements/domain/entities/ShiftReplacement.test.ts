import { describe, it, expect } from "vitest";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

const base = {
  date: new Date("2026-07-01"),
  requesterId: "u1",
  specialtyId: "s1",
  moduleHours: 12,
  requesterStart: new Date("2026-07-01T08:00:00"),
  requesterEnd: new Date("2026-07-01T20:00:00"),
  resolvedById: null as string | null,
};

const open = (overrides?: Partial<typeof base>) =>
  ShiftReplacement.fromPersistence({ id: "r1", state: RequestState.OPEN, ...base, ...overrides });

describe("ShiftReplacement state machine", () => {
  it("confirmar: OPEN → CONFIRMED", () => {
    const r = open();
    const res = r.confirm("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.CONFIRMED);
    expect(r.resolvedById).toBe("coord");
  });

  it("no se puede confirmar un REJECTED", () => {
    const r = open();
    r.rejectRequest("coord");
    expect(r.confirm("coord").isOk).toBe(false);
  });

  it("rechazar solicitud: OPEN → REJECTED (terminal)", () => {
    const r = open();
    const res = r.rejectRequest("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.REJECTED);
  });

  it("no se puede rechazar un CONFIRMED", () => {
    const r = open();
    r.confirm("coord");
    expect(r.rejectRequest("coord").isOk).toBe(false);
  });

  it("isOpen retorna true solo para OPEN", () => {
    expect(open().isOpen).toBe(true);
    const r = open();
    r.confirm("coord");
    expect(r.isOpen).toBe(false);
  });

  it("exposed getters return correct values", () => {
    const r = open();
    expect(r.id).toBe("r1");
    expect(r.requesterId).toBe("u1");
    expect(r.specialtyId).toBe("s1");
    expect(r.moduleHours).toBe(12);
    expect(r.requesterStart).toEqual(new Date("2026-07-01T08:00:00"));
    expect(r.requesterEnd).toEqual(new Date("2026-07-01T20:00:00"));
  });
});
