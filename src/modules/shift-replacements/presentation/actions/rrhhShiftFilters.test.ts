import { describe, it, expect } from "vitest";
import {
  filterConfirmedShiftsForRRHH,
  type RrhhReplacementFilters,
  type FilterableShift,
} from "@shift-replacements/presentation/actions/rrhhShiftFilters";

function shift(overrides: Partial<FilterableShift> = {}): FilterableShift {
  return {
    specialtyId: "s1",
    bajoFactura: false,
    requesterStart: new Date("2026-07-10T08:00:00.000Z"),
    ...overrides,
  };
}

const base: RrhhReplacementFilters = {
  start: "2026-07-01",
  end: "2026-07-31",
};

describe("filterConfirmedShiftsForRRHH", () => {
  it("keeps shifts whose start falls inside the date range", () => {
    const inside = shift({ requesterStart: new Date("2026-07-10T08:00:00.000Z") });
    const before = shift({ requesterStart: new Date("2026-06-20T08:00:00.000Z") });
    const after = shift({ requesterStart: new Date("2026-08-05T08:00:00.000Z") });

    const result = filterConfirmedShiftsForRRHH([inside, before, after], base);

    expect(result).toEqual([inside]);
  });

  it("filters by specialtyId when provided", () => {
    const s1 = shift({ specialtyId: "s1" });
    const s2 = shift({ specialtyId: "s2" });

    const result = filterConfirmedShiftsForRRHH([s1, s2], {
      ...base,
      specialtyId: "s2",
    });

    expect(result).toEqual([s2]);
  });

  it("does not filter by specialty when specialtyId is omitted", () => {
    const s1 = shift({ specialtyId: "s1" });
    const s2 = shift({ specialtyId: "s2" });

    const result = filterConfirmedShiftsForRRHH([s1, s2], base);

    expect(result).toHaveLength(2);
  });

  it("filters by bajoFactura=true when provided", () => {
    const billed = shift({ bajoFactura: true });
    const notBilled = shift({ bajoFactura: false });

    const result = filterConfirmedShiftsForRRHH([billed, notBilled], {
      ...base,
      bajoFactura: true,
    });

    expect(result).toEqual([billed]);
  });

  it("filters by bajoFactura=false when provided", () => {
    const billed = shift({ bajoFactura: true });
    const notBilled = shift({ bajoFactura: false });

    const result = filterConfirmedShiftsForRRHH([billed, notBilled], {
      ...base,
      bajoFactura: false,
    });

    expect(result).toEqual([notBilled]);
  });

  it("combines specialty, bajoFactura, and date filters", () => {
    const match = shift({
      specialtyId: "s2",
      bajoFactura: true,
      requesterStart: new Date("2026-07-15T08:00:00.000Z"),
    });
    const wrongSpecialty = shift({
      specialtyId: "s1",
      bajoFactura: true,
      requesterStart: new Date("2026-07-15T08:00:00.000Z"),
    });
    const wrongBilling = shift({
      specialtyId: "s2",
      bajoFactura: false,
      requesterStart: new Date("2026-07-15T08:00:00.000Z"),
    });
    const outOfRange = shift({
      specialtyId: "s2",
      bajoFactura: true,
      requesterStart: new Date("2026-09-15T08:00:00.000Z"),
    });

    const result = filterConfirmedShiftsForRRHH(
      [match, wrongSpecialty, wrongBilling, outOfRange],
      { start: "2026-07-01", end: "2026-07-31", specialtyId: "s2", bajoFactura: true },
    );

    expect(result).toEqual([match]);
  });
});
