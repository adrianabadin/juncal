import { describe, it, expect, beforeEach, vi } from "vitest";

// Boundary test: proves the server actions forward `bajoFactura` from the
// parsed schema input into the use case, instead of hardcoding `false`.
// The action has no DI seam (it `new`s Prisma repos and reads the session
// directly), so we stub the server-only collaborators and the use-case
// classes to capture the command they receive.

const requestAbsenceExecute = vi.fn();
const createCompulsoryExecute = vi.fn();

vi.mock("@users/presentation/session", () => ({
  getCurrentActor: vi.fn(async () => ({
    userId: "req",
    role: "COORDINATOR",
    isActive: true,
  })),
}));

vi.mock("@shift-replacements/infrastructure/persistence/PrismaShiftReplacementRepository", () => ({
  PrismaShiftReplacementRepository: class {},
}));

vi.mock("@absence-reasons/infrastructure/persistence/PrismaAbsenceReasonRepository", () => ({
  PrismaAbsenceReasonRepository: class {},
}));

vi.mock("@users/infrastructure/persistence/prismaHasSpecialty", () => ({
  prismaHasSpecialty: vi.fn(async () => true),
}));

vi.mock("@shared/infrastructure/prisma/client", () => ({
  prisma: {},
}));

vi.mock("@shift-replacements/application/use-cases/RequestAbsence", () => ({
  RequestAbsence: class {
    execute = requestAbsenceExecute;
  },
}));

vi.mock("@shift-replacements/application/use-cases/CreateCompulsoryReplacement", () => ({
  CreateCompulsoryReplacement: class {
    execute = createCompulsoryExecute;
  },
}));

import {
  requestAbsenceAction,
  createCompulsoryAction,
} from "@shift-replacements/presentation/actions/shiftActions";

const okShift = {
  isOk: true as const,
  value: {
    id: "shift-1",
    date: new Date("2026-07-01T08:00:00"),
    state: "OPEN",
    specialtyId: "s1",
    requesterId: "req",
    moduleHours: 12,
    requesterStart: new Date("2026-07-01T08:00:00"),
    requesterEnd: new Date("2026-07-01T20:00:00"),
    resolvedById: null,
  },
};

const absenceInput = {
  specialtyId: "s1",
  moduleHours: 12,
  requesterStart: "2026-07-01T08:00",
  requesterEnd: "2026-07-01T20:00",
  absenceReasonId: "ar-enfermedad",
  isDefault: true,
};

const compulsoryInput = {
  ...absenceInput,
  requesterId: "req",
  applicantId: "app",
  coverageStart: "2026-07-01T08:00",
  coverageEnd: "2026-07-01T14:00",
};

describe("requestAbsenceAction — bajoFactura forwarding", () => {
  beforeEach(() => {
    requestAbsenceExecute.mockReset();
    requestAbsenceExecute.mockResolvedValue(okShift);
  });

  it("forwards bajoFactura=true to the use case", async () => {
    await requestAbsenceAction({ ...absenceInput, bajoFactura: true });
    expect(requestAbsenceExecute).toHaveBeenCalledTimes(1);
    expect(requestAbsenceExecute.mock.calls[0][0]).toMatchObject({
      bajoFactura: true,
    });
  });

  it("defaults bajoFactura to false when omitted", async () => {
    await requestAbsenceAction({ ...absenceInput });
    expect(requestAbsenceExecute.mock.calls[0][0]).toMatchObject({
      bajoFactura: false,
    });
  });
});

describe("createCompulsoryAction — bajoFactura forwarding", () => {
  beforeEach(() => {
    createCompulsoryExecute.mockReset();
    createCompulsoryExecute.mockResolvedValue(okShift);
  });

  it("forwards bajoFactura=true to the use case", async () => {
    await createCompulsoryAction({ ...compulsoryInput, bajoFactura: true });
    expect(createCompulsoryExecute).toHaveBeenCalledTimes(1);
    expect(createCompulsoryExecute.mock.calls[0][0]).toMatchObject({
      bajoFactura: true,
    });
  });

  it("defaults bajoFactura to false when omitted", async () => {
    await createCompulsoryAction({ ...compulsoryInput });
    expect(createCompulsoryExecute.mock.calls[0][0]).toMatchObject({
      bajoFactura: false,
    });
  });
});
