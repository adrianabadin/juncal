import { describe, it, expect } from "vitest";
import { ShiftCoverage } from "@shift-replacements/domain/entities/ShiftCoverage";
import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";

describe("ShiftCoverage", () => {
  it("durationMinutes computes correctly", () => {
    const c = ShiftCoverage.fromPersistence({
      id: "c1",
      shiftReplacementId: "r1",
      applicantId: "u2",
      start: new Date("2026-07-01T08:00:00"),
      end: new Date("2026-07-01T14:00:00"),
      origin: CoverageOrigin.POSTULATION,
    });
    expect(c.durationMinutes).toBe(360);
  });

  it("exposes all properties", () => {
    const c = ShiftCoverage.fromPersistence({
      id: "c2",
      shiftReplacementId: "r2",
      applicantId: "u3",
      start: new Date("2026-07-01T20:00:00"),
      end: new Date("2026-07-02T08:00:00"),
      origin: CoverageOrigin.COMPULSORY,
    });
    expect(c.id).toBe("c2");
    expect(c.shiftReplacementId).toBe("r2");
    expect(c.applicantId).toBe("u3");
    expect(c.origin).toBe(CoverageOrigin.COMPULSORY);
  });
});
