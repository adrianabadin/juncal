import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * RSC boundary guard.
 *
 * `src/modules/users/presentation/session.ts` imports `cookies` from
 * `next/headers`, which is server-only. Any page or layout that calls
 * `getCurrentActor()` (directly or through a server action) MUST stay a
 * Server Component. Adding `"use client"` to such a file pulls `session.ts`
 * (and `next/headers`) into the client module graph and breaks the build:
 *
 *   You're importing a module that depends on "next/headers". This API is
 *   only available in Server Components in the App Router...
 *
 * These tests fail loudly if any of those server pages/layouts regress into
 * Client Components.
 */

const repoRoot = join(__dirname, "..", "..");

const serverOnlyEntrypoints = [
  "src/app/(dashboard)/layout.tsx",
  "src/app/(dashboard)/motivos/page.tsx",
  "src/app/(dashboard)/rrhh/page.tsx",
];

function firstDirective(source: string): string | null {
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") continue;
    if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
      continue;
    }
    const match = line.match(/^(['"])(use client|use server)\1\s*;?$/);
    return match ? match[2] : null;
  }
  return null;
}

describe("dashboard RSC boundaries", () => {
  it.each(serverOnlyEntrypoints)(
    "%s must not declare 'use client' (keeps next/headers out of the client graph)",
    (relativePath) => {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(firstDirective(source)).not.toBe("use client");
    },
  );

  it("absenceReasonActions.ts ('use server') must not re-export the DTO type", () => {
    // A "use server" file should only export async server actions. Re-exporting
    // a type (`export type { AbsenceReasonDto }`) makes the Turbopack flight
    // loader emit a runtime ACTIONS_MODULE reference for an erased type, which
    // fails the build with:
    //   The export AbsenceReasonDto was not found in module ... [app-rsc]
    // Consumers must import the DTO type from absenceReasonDto.ts instead.
    const source = readFileSync(
      join(
        repoRoot,
        "src/modules/absence-reasons/presentation/actions/absenceReasonActions.ts",
      ),
      "utf8",
    );
    expect(firstDirective(source)).toBe("use server");
    expect(source).not.toMatch(/export\s+type\s*\{[^}]*AbsenceReasonDto/);
  });
});
