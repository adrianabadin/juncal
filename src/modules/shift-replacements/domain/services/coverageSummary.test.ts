import { describe, it, expect } from "vitest";
import { summarizeCoverage } from "@shift-replacements/domain/services/coverageSummary";

describe("summarizeCoverage", () => {
  const base = new Date("2026-07-01T00:00:00");
  const h = (n: number) => new Date(base.getTime() + n * 3600_000);

  it("no coverages → fully covered false, gaps = entire window", () => {
    const s = summarizeCoverage(h(0), h(12), []);
    expect(s.requiredMinutes).toBe(720);
    expect(s.coveredMinutes).toBe(0);
    expect(s.fullyCovered).toBe(false);
    expect(s.gaps).toHaveLength(1);
  });

  it("single coverage covers entire window", () => {
    const s = summarizeCoverage(h(0), h(12), [{ start: h(0), end: h(12) }]);
    expect(s.coveredMinutes).toBe(720);
    expect(s.fullyCovered).toBe(true);
    expect(s.gaps).toHaveLength(0);
  });

  it("two coverages with a gap", () => {
    const s = summarizeCoverage(h(0), h(12), [
      { start: h(0), end: h(4) },
      { start: h(8), end: h(12) },
    ]);
    expect(s.coveredMinutes).toBe(480);
    expect(s.fullyCovered).toBe(false);
    expect(s.gaps).toHaveLength(1);
    expect(s.gaps[0].start).toEqual(h(4));
    expect(s.gaps[0].end).toEqual(h(8));
  });

  it("overlapping coverages merge", () => {
    const s = summarizeCoverage(h(0), h(12), [
      { start: h(0), end: h(6) },
      { start: h(4), end: h(10) },
    ]);
    expect(s.coveredMinutes).toBe(600);
    expect(s.gaps).toHaveLength(1);
  });

  it("coverage partially outside window is clipped", () => {
    const s = summarizeCoverage(h(2), h(10), [
      { start: h(0), end: h(6) },
    ]);
    expect(s.coveredMinutes).toBe(240); // h(2)→h(6) = 4h
  });
});
