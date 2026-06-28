import { describe, it, expect, beforeEach, vi } from "vitest";

// Boundary test: proves mapShiftToDto exposes `bajoFactura` on the outgoing
// DTO. mapShiftToDto is private, so we exercise it through an exported action
// (listConfirmedShiftsAction) that maps repository rows into ShiftDto/
// PostulatedShiftDto. The action `new`s Prisma repos and reads the session
// directly, so we stub those collaborators.

const { listByState, listCoverages, findMany } = vi.hoisted(() => ({
  listByState: vi.fn(),
  listCoverages: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@users/presentation/session", () => ({
  getCurrentActor: vi.fn(async () => ({
    userId: "coord",
    role: "COORDINATOR",
    isActive: true,
  })),
}));

vi.mock("@shift-replacements/infrastructure/persistence/PrismaShiftReplacementRepository", () => ({
  PrismaShiftReplacementRepository: class {
    listByState = listByState;
    listCoverages = listCoverages;
  },
}));

vi.mock("@absence-reasons/infrastructure/persistence/PrismaAbsenceReasonRepository", () => ({
  PrismaAbsenceReasonRepository: class {},
}));

vi.mock("@users/infrastructure/persistence/prismaHasSpecialty", () => ({
  prismaHasSpecialty: vi.fn(async () => true),
}));

vi.mock("@shared/infrastructure/prisma/client", () => ({
  prisma: { user: { findMany } },
}));

import { listConfirmedShiftsAction } from "@shift-replacements/presentation/actions/shiftActions";

function buildRow(bajoFactura: boolean, absenceReasonId: string | null = "ar-1") {
  return {
    id: "shift-1",
    date: new Date("2026-07-01T08:00:00"),
    state: "CONFIRMED",
    specialtyId: "s1",
    requesterId: "req",
    moduleHours: 12,
    requesterStart: new Date("2026-07-01T08:00:00"),
    requesterEnd: new Date("2026-07-01T20:00:00"),
    resolvedById: "coord",
    bajoFactura,
    absenceReasonId,
  };
}

describe("mapShiftToDto — bajoFactura exposure", () => {
  beforeEach(() => {
    listByState.mockReset();
    listCoverages.mockReset();
    findMany.mockReset();
    listCoverages.mockResolvedValue([]);
    findMany.mockResolvedValue([{ id: "req", name: "Requester" }]);
  });

  it("exposes bajoFactura=true on the mapped DTO", async () => {
    listByState.mockResolvedValue([buildRow(true)]);

    const result = await listConfirmedShiftsAction();

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].bajoFactura).toBe(true);
    }
  });

  it("exposes bajoFactura=false on the mapped DTO", async () => {
    listByState.mockResolvedValue([buildRow(false)]);

    const result = await listConfirmedShiftsAction();

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].bajoFactura).toBe(false);
    }
  });

  it("exposes absenceReasonId on the mapped DTO (for RRHH reason KPI)", async () => {
    listByState.mockResolvedValue([buildRow(true, "ar-enfermedad")]);

    const result = await listConfirmedShiftsAction();

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data[0].absenceReasonId).toBe("ar-enfermedad");
    }
  });
});
