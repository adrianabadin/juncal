import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("worklist layout", () => {
  it("renders coordinator worklists as full-width rows instead of cards", () => {
    const source = readSource("src/app/(dashboard)/coordinator/page.tsx");

    expect(source).not.toContain("@shared/presentation/ui/Card");
    expect(source).not.toContain("<Card");
    expect(source).toContain("function ShiftRow");
    expect(source).toContain("<ul className=\"w-full divide-y");
  });

  it("renders specialty worklist items as full-width rows without card styling", () => {
    const source = readSource(
      "src/modules/shift-replacements/presentation/components/OpenShiftsList.tsx",
    );

    expect(source).toContain("<ul className=\"w-full divide-y");
    expect(source).not.toContain("rounded-lg");
    expect(source).not.toContain("shadow-sm");
  });
});
