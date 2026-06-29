import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Layout contract for AssignCompulsoryForm.
 *
 * Both CreateFromScratchForm and ExistingShiftForm must use a 2-column
 * grid layout at the md: breakpoint (single-column on mobile). The submit
 * button must span the full width.
 */

const repoRoot = join(__dirname, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const formPath =
  "src/modules/shift-replacements/presentation/components/AssignCompulsoryForm.tsx";

describe("AssignCompulsoryForm 2-column layout contract", () => {
  it("CreateFromScratchForm uses grid-cols-1 md:grid-cols-2 layout", () => {
    const source = readSource(formPath);
    // The scratch form's field wrapper must declare responsive columns.
    expect(source).toMatch(/grid-cols-1\s+md:grid-cols-2/);
  });

  it("ExistingShiftForm uses grid-cols-1 md:grid-cols-2 layout", () => {
    const source = readSource(formPath);
    // Count occurrences — both forms must each have the grid pattern.
    const matches = source.match(/grid-cols-1\s+md:grid-cols-2/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });
});
