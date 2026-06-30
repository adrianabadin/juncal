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

// Regression: HTML <select> always produces string values. The domain schema
// uses z.coerce.number() for moduleHours, so the server action must accept
// string moduleHours ("6", "12", "24") and coerce them to numbers. Before the
// fix, the form schemas used z.literal(6) which rejected the string "6" with
// "Invalid input: expected 6".
describe("requestAbsenceAction — moduleHours string coercion (regression)", () => {
  beforeEach(() => {
    requestAbsenceExecute.mockReset();
    requestAbsenceExecute.mockResolvedValue(okShift);
  });

  it("accepts moduleHours as string '6' from HTML select and coerces to number", async () => {
    const result = await requestAbsenceAction({
      ...absenceInput,
      moduleHours: "6" as unknown as number,
    });
    expect(result.ok).toBe(true);
    expect(requestAbsenceExecute).toHaveBeenCalledTimes(1);
    expect(requestAbsenceExecute.mock.calls[0][0]).toMatchObject({
      moduleHours: 6,
    });
  });

  it("accepts moduleHours as string '12' and coerces to number", async () => {
    const result = await requestAbsenceAction({
      ...absenceInput,
      moduleHours: "12" as unknown as number,
    });
    expect(result.ok).toBe(true);
    expect(requestAbsenceExecute.mock.calls[0][0]).toMatchObject({
      moduleHours: 12,
    });
  });

  it("accepts moduleHours as string '24' and coerces to number", async () => {
    const result = await requestAbsenceAction({
      ...absenceInput,
      moduleHours: "24" as unknown as number,
    });
    expect(result.ok).toBe(true);
    expect(requestAbsenceExecute.mock.calls[0][0]).toMatchObject({
      moduleHours: 24,
    });
  });
});

describe("createCompulsoryAction — moduleHours string coercion (regression)", () => {
  beforeEach(() => {
    createCompulsoryExecute.mockReset();
    createCompulsoryExecute.mockResolvedValue(okShift);
  });

  it("accepts moduleHours as string '6' from HTML select and coerces to number", async () => {
    const result = await createCompulsoryAction({
      ...compulsoryInput,
      moduleHours: "6" as unknown as number,
    });
    expect(result.ok).toBe(true);
    expect(createCompulsoryExecute).toHaveBeenCalledTimes(1);
    expect(createCompulsoryExecute.mock.calls[0][0]).toMatchObject({
      moduleHours: 6,
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
