import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Client-contract guard for PostulateButton's submit payload.
 *
 * The server schema (`postulateSchema` → `utcWallClockDate`) interprets bare
 * `datetime-local` strings (`YYYY-MM-DDTHH:mm`) as UTC wall-clock and is the
 * authoritative normalizer. PostulateButton MUST send those bare values
 * straight through (the `start`/`end` state already holds them) instead of
 * pre-converting with `new Date(value).toISOString()`.
 *
 * `new Date("YYYY-MM-DDTHH:mm").toISOString()` parses the value in the
 * browser's LOCAL timezone and emits a shifted UTC instant, defeating the
 * server normalization and pushing exact-boundary postulations out of window.
 * These tests fail loudly if that local-shifting conversion reappears.
 */

const repoRoot = join(__dirname, "..", "..", "..", "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const componentPath =
  "src/modules/shift-replacements/presentation/components/PostulateButton.tsx";

describe("PostulateButton submit payload — UTC wall-clock client contract", () => {
  it("does NOT pre-convert datetime-local values with new Date(...).toISOString()", () => {
    const source = readSource(componentPath);
    expect(source).not.toMatch(/new Date\(\s*start\s*\)\.toISOString\(\)/);
    expect(source).not.toMatch(/new Date\(\s*end\s*\)\.toISOString\(\)/);
  });

  it("sends bare datetime-local start/end state straight to postulateAction", () => {
    const source = readSource(componentPath);
    const callMatch = source.match(/postulateAction\(\{[\s\S]*?\}\)/);
    expect(callMatch).not.toBeNull();
    const callBlock = callMatch![0];
    // The payload must reference the raw `start` / `end` state without wrapping
    // them in a local-zone Date conversion.
    expect(callBlock).toMatch(/start[,:]/);
    expect(callBlock).toMatch(/end[,:]/);
    expect(callBlock).not.toContain("toISOString");
  });
});
