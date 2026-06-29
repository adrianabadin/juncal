import { describe, it, expect } from "vitest";
import {
  formatShiftDateLabel,
  formatShiftTime,
} from "@shift-replacements/presentation/components/worklistFormat";

describe("formatShiftDateLabel", () => {
  it("prefixes the weekday before the date for a known day", () => {
    // 2026-06-24 is a Wednesday (miércoles).
    const label = formatShiftDateLabel("2026-06-24T09:00:00.000Z");
    expect(label).toBe("miércoles 24/06/2026");
  });

  it("uses the correct weekday for a Sunday", () => {
    // 2026-06-28 is a Sunday (domingo).
    const label = formatShiftDateLabel("2026-06-28T09:00:00.000Z");
    expect(label).toBe("domingo 28/06/2026");
  });

  it("zero-pads single-digit day and month", () => {
    // 2026-01-05 is a Monday (lunes).
    const label = formatShiftDateLabel("2026-01-05T12:00:00.000Z");
    expect(label).toBe("lunes 05/01/2026");
  });
});

describe("formatShiftTime", () => {
  it("formats an ISO timestamp as HH:mm in 24h", () => {
    expect(formatShiftTime("2026-06-24T09:05:00.000Z")).toBe("09:05");
    expect(formatShiftTime("2026-06-24T18:30:00.000Z")).toBe("18:30");
  });
});
