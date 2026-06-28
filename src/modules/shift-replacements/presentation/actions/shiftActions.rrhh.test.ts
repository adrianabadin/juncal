import { describe, it, expect, beforeEach, vi } from "vitest";

// Action-level test for listConfirmedShiftsForRRHHAction.
// The action `new`s Prisma repos and reads the session directly, so we stub
// the server-only collaborators (same seam as shiftActions.dto.test.ts).
//
// IMPORTANT: `repo.listByState(...)` returns real `ShiftReplacement` CLASS
// instances in production (getters over a private `props`). Earlier versions of
// this test mocked it with PLAIN OBJECTS, which hid a real bug: spreading a
// class instance (`...s`) drops getter-backed fields after ESBuild compilation,
// leaving `requesterId: undefined`. We now construct genuine instances via
// `ShiftReplacement.fromPersistence(...)` so the test exercises production reality.

const { listByState, listCoverages, findMany, reasonFindMany, getCurrentActor } =
  vi.hoisted(() => ({
    listByState: vi.fn(),
    listCoverages: vi.fn(),
    findMany: vi.fn(),
    reasonFindMany: vi.fn(),
    getCurrentActor: vi.fn(),
  }));

vi.mock("@users/presentation/session", () => ({
  getCurrentActor,
}));

vi.mock(
  "@shift-replacements/infrastructure/persistence/PrismaShiftReplacementRepository",
  () => ({
    PrismaShiftReplacementRepository: class {
      listByState = listByState;
      listCoverages = listCoverages;
    },
  }),
);

vi.mock(
  "@absence-reasons/infrastructure/persistence/PrismaAbsenceReasonRepository",
  () => ({ PrismaAbsenceReasonRepository: class {} }),
);

vi.mock("@users/infrastructure/persistence/prismaHasSpecialty", () => ({
  prismaHasSpecialty: vi.fn(async () => true),
}));

vi.mock("@shared/infrastructure/prisma/client", () => ({
  prisma: {
    user: { findMany },
    absenceReason: { findMany: reasonFindMany },
  },
}));

import { listConfirmedShiftsForRRHHAction } from "@shift-replacements/presentation/actions/shiftActions";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

function confirmedRow(
  overrides: Partial<{
    id: string;
    date: Date;
    specialtyId: string;
    requesterId: string;
    moduleHours: number;
    requesterStart: Date;
    requesterEnd: Date;
    resolvedById: string | null;
    absenceReasonId: string | null;
    observation: string | null;
    bajoFactura: boolean;
  }> = {},
): ShiftReplacement {
  return ShiftReplacement.fromPersistence({
    id: "shift-1",
    date: new Date("2026-07-10T08:00:00.000Z"),
    state: RequestState.CONFIRMED,
    specialtyId: "s1",
    requesterId: "req",
    moduleHours: 12,
    requesterStart: new Date("2026-07-10T08:00:00.000Z"),
    requesterEnd: new Date("2026-07-10T20:00:00.000Z"),
    resolvedById: "coord",
    absenceReasonId: null,
    observation: null,
    bajoFactura: false,
    ...overrides,
  });
}

const filters = { start: "2026-07-01", end: "2026-07-31" };

describe("listConfirmedShiftsForRRHHAction", () => {
  beforeEach(() => {
    listByState.mockReset();
    listCoverages.mockReset();
    findMany.mockReset();
    reasonFindMany.mockReset();
    getCurrentActor.mockReset();
    listCoverages.mockResolvedValue([]);
    findMany.mockResolvedValue([{ id: "req", name: "Dra. Ruiz" }]);
    reasonFindMany.mockResolvedValue([]);
  });

  it("rejects non-RRHH actors with an authorization error", async () => {
    getCurrentActor.mockResolvedValue({
      userId: "coord",
      role: "COORDINATOR",
      isActive: true,
    });
    listByState.mockResolvedValue([confirmedRow()]);

    const result = await listConfirmedShiftsForRRHHAction(filters);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("No autorizado");
  });

  it("rejects unauthenticated actors", async () => {
    getCurrentActor.mockResolvedValue(null);

    const result = await listConfirmedShiftsForRRHHAction(filters);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("No autenticado");
  });

  it("returns confirmed shifts with resolved requester names for RRHH actors", async () => {
    getCurrentActor.mockResolvedValue({
      userId: "rrhh",
      role: "RRHH",
      isActive: true,
    });
    listByState.mockResolvedValue([confirmedRow()]);

    const result = await listConfirmedShiftsForRRHHAction(filters);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].requesterId).toBe("req");
      expect(result.data[0].requesterName).toBe("Dra. Ruiz");
      expect(result.data[0].bajoFactura).toBe(false);
      // absenceReasonId is null on this row → reasonName must fall back to null,
      // never throw.
      expect(result.data[0].reasonName).toBeNull();
    }
  });

  it("resolves reasonName and requesterName for a shift with a coverage applicant distinct from the requester", async () => {
    // Regression guard: in production `listByState` yields class instances whose
    // fields are getter-backed. If the action spreads the instance instead of its
    // props, `requesterId`/`absenceReasonId` come back undefined and BOTH the
    // user lookup AND the reason lookup silently break. This test wires a real
    // applicant (different from the requester) and a real absence reason so the
    // result can only be correct when those fields survive the mapping.
    getCurrentActor.mockResolvedValue({
      userId: "rrhh",
      role: "RRHH",
      isActive: true,
    });
    listByState.mockResolvedValue([
      confirmedRow({ id: "shift-9", requesterId: "req", absenceReasonId: "reason-1" }),
    ]);
    listCoverages.mockResolvedValue([
      {
        id: "cov-1",
        shiftReplacementId: "shift-9",
        applicantId: "applicant-7",
        start: new Date("2026-07-10T08:00:00.000Z"),
        end: new Date("2026-07-10T20:00:00.000Z"),
        origin: "VOLUNTARY",
      },
    ]);
    findMany.mockResolvedValue([
      { id: "req", name: "Dra. Ruiz" },
      { id: "applicant-7", name: "Dr. Pérez" },
    ]);
    reasonFindMany.mockResolvedValue([{ id: "reason-1", name: "Enfermedad" }]);

    const result = await listConfirmedShiftsForRRHHAction(filters);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data).toHaveLength(1);
      const row = result.data[0];
      expect(row.id).toBe("shift-9");
      expect(row.requesterId).toBe("req");
      expect(row.requesterName).toBe("Dra. Ruiz");
      expect(row.absenceReasonId).toBe("reason-1");
      expect(row.reasonName).toBe("Enfermedad");
      expect(row.coverages).toHaveLength(1);
      expect(row.coverages[0].applicantId).toBe("applicant-7");
      expect(row.coverages[0].applicantName).toBe("Dr. Pérez");
    }
  });

  it("applies specialty and bajoFactura filters before returning rows", async () => {
    getCurrentActor.mockResolvedValue({
      userId: "rrhh",
      role: "RRHH",
      isActive: true,
    });
    listByState.mockResolvedValue([
      confirmedRow({ id: "a", specialtyId: "s1", bajoFactura: true }),
      confirmedRow({ id: "b", specialtyId: "s2", bajoFactura: true }),
      confirmedRow({ id: "c", specialtyId: "s2", bajoFactura: false }),
    ]);

    const result = await listConfirmedShiftsForRRHHAction({
      ...filters,
      specialtyId: "s2",
      bajoFactura: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("b");
    }
  });

  it("returns empty list when no confirmed shifts match the date range", async () => {
    getCurrentActor.mockResolvedValue({
      userId: "rrhh",
      role: "RRHH",
      isActive: true,
    });
    listByState.mockResolvedValue([
      confirmedRow({ requesterStart: new Date("2026-09-10T08:00:00.000Z") }),
    ]);

    const result = await listConfirmedShiftsForRRHHAction(filters);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data).toHaveLength(0);
    }
  });
});
