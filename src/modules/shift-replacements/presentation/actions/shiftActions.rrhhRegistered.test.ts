import { describe, it, expect, beforeEach, vi } from "vitest";

// Action-level test for countRegisteredReplacementsForRRHHAction.
// Counts replacements across all lifecycle states within the filter window,
// used as the denominator for the "solicitudes aprobadas sobre registradas"
// approval-rate KPI.

const { listByState, getCurrentActor } = vi.hoisted(() => ({
  listByState: vi.fn(),
  getCurrentActor: vi.fn(),
}));

vi.mock("@users/presentation/session", () => ({ getCurrentActor }));

vi.mock(
  "@shift-replacements/infrastructure/persistence/PrismaShiftReplacementRepository",
  () => ({
    PrismaShiftReplacementRepository: class {
      listByState = listByState;
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
  prisma: { user: { findMany: vi.fn() } },
}));

import { countRegisteredReplacementsForRRHHAction } from "@shift-replacements/presentation/actions/shiftActions";

function row(id: string, requesterStart: string, specialtyId = "s1") {
  return {
    id,
    specialtyId,
    requesterStart: new Date(requesterStart),
    bajoFactura: false,
  };
}

const filters = { start: "2026-07-01", end: "2026-07-31" };

describe("countRegisteredReplacementsForRRHHAction", () => {
  beforeEach(() => {
    listByState.mockReset();
    getCurrentActor.mockReset();
  });

  it("rejects non-RRHH actors", async () => {
    getCurrentActor.mockResolvedValue({ userId: "c", role: "COORDINATOR" });
    listByState.mockResolvedValue([]);

    const result = await countRegisteredReplacementsForRRHHAction(filters);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("No autorizado");
  });

  it("counts replacements across all states within the date window", async () => {
    getCurrentActor.mockResolvedValue({ userId: "r", role: "RRHH" });
    // Each listByState call returns one in-range row.
    listByState.mockResolvedValue([row("x", "2026-07-10T08:00:00.000Z")]);

    const result = await countRegisteredReplacementsForRRHHAction(filters);

    expect(result.ok).toBe(true);
    // 4 states (OPEN, POSTULATED, CONFIRMED, REJECTED) × 1 in-range row each.
    if (result.ok) expect(result.data).toBe(4);
  });

  it("excludes rows outside the date window", async () => {
    getCurrentActor.mockResolvedValue({ userId: "r", role: "RRHH" });
    listByState.mockResolvedValue([
      row("in", "2026-07-10T08:00:00.000Z"),
      row("out", "2026-09-10T08:00:00.000Z"),
    ]);

    const result = await countRegisteredReplacementsForRRHHAction(filters);

    expect(result.ok).toBe(true);
    // 4 states × 1 in-range row (the out-of-range row is excluded each time).
    if (result.ok) expect(result.data).toBe(4);
  });

  it("respects the specialty filter in the registered count", async () => {
    getCurrentActor.mockResolvedValue({ userId: "r", role: "RRHH" });
    listByState.mockResolvedValue([
      row("a", "2026-07-10T08:00:00.000Z", "s1"),
      row("b", "2026-07-10T08:00:00.000Z", "s2"),
    ]);

    const result = await countRegisteredReplacementsForRRHHAction({
      ...filters,
      specialtyId: "s2",
    });

    expect(result.ok).toBe(true);
    // 4 states × 1 matching-specialty row each.
    if (result.ok) expect(result.data).toBe(4);
  });
});
