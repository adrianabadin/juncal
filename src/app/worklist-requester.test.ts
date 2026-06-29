import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Visible-contract guard for the open worklist requester name.
 *
 * The open worklist must show "Solicitante:" with the human-readable
 * requester name, falling back to the raw requester id when the name is
 * unknown. The open-shift list actions are responsible for populating
 * `requesterName` on every row they return. These tests fail loudly if the
 * label disappears, the fallback is removed, or the actions stop resolving
 * requester names for open shifts.
 *
 * No React Testing Library / jsdom is available in this repo, so this is a
 * static source guard (same approach as worklist-layout/worklist-labels).
 */

const repoRoot = join(__dirname, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const openShiftsListPath =
  "src/modules/shift-replacements/presentation/components/OpenShiftsList.tsx";
const shiftActionsPath =
  "src/modules/shift-replacements/presentation/actions/shiftActions.ts";

describe("open worklist requester name contract", () => {
  it("OpenShiftsList renders the 'Solicitante:' label", () => {
    const source = readSource(openShiftsListPath);
    expect(source).toContain("Solicitante:");
  });

  it("OpenShiftsList prefers requesterName and falls back to requesterId", () => {
    const source = readSource(openShiftsListPath);
    expect(source).toContain("shift.requesterName ?? shift.requesterId");
  });

  it("ShiftDto declares an optional requesterName field", () => {
    const source = readSource(shiftActionsPath);
    expect(source).toContain("requesterName?: string");
  });

  it("open-shift list actions populate requesterName with id fallback", () => {
    const source = readSource(shiftActionsPath);

    // The shared resolver must exist and be used by the open-shift actions.
    expect(source).toContain("async function resolveRequesterNames");

    // Both open-shift list actions must resolve names and populate the row
    // with a fallback to the raw requester id.
    const populateMatches = source.match(
      /requesterName:\s*nameById\.get\(s\.requesterId\)\s*\?\?\s*s\.requesterId/g,
    );
    expect(populateMatches).not.toBeNull();
    expect(populateMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
