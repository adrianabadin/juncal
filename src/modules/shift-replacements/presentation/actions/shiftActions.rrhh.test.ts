import { describe, it, expect, beforeEach, vi } from "vitest";

// Action-level test for listConfirmedShiftsForRRHHAction.
// The action `new`s Prisma repos and reads the session directly, so we stub
// the server-only collaborators (same seam as shiftActions.dto.test.ts).

const { listByState, listCoverages, findMany, getCurrentActor } = vi.hoisted(
  () => ({
    listByState: vi.fn(),
    listCoverages: vi.fn(),
    findMany: vi.fn(),
    getCurrentActor: vi.fn(),
  }),
);

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
  prisma: { user: { findMany } },
}));

import { listConfirmedShiftsForRRHHAction } from "@shift-replacements/presentation/actions/shiftActions";

function confirmedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "shift-1",
    date: new Date("2026-07-10T08:00:00.000Z"),
    state: "CONFIRMED",
    specialtyId: "s1",
    requesterId: "req",
    moduleHours: 12,
    requesterStart: new Date("2026-07-10T08:00:00.000Z"),
    requesterEnd: new Date("2026-07-10T20:00:00.000Z"),
    resolvedById: "coord",
    bajoFactura: false,
    ...overrides,
  };
}

const filters = { start: "2026-07-01", end: "2026-07-31" };

describe("listConfirmedShiftsForRRHHAction", () => {
  beforeEach(() => {
    listByState.mockReset();
    listCoverages.mockReset();
    findMany.mockReset();
    getCurrentActor.mockReset();
    listCoverages.mockResolvedValue([]);
    findMany.mockResolvedValue([{ id: "req", name: "Dra. Ruiz" }]);
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
      expect(result.data[0].requesterName).toBe("Dra. Ruiz");
      expect(result.data[0].bajoFactura).toBe(false);
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
