import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Navigation reachability guard.
 *
 * `/motivos` is a coordinator-only management page that must be reachable from
 * the UI, consistently with `/specialties`. These tests fail loudly if the main
 * menu (`AppHeader`) or the dashboard landing grid stops exposing a Motivos
 * entry, which would leave the page accessible only by typing the URL.
 */

const repoRoot = join(__dirname, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("navigation entrypoints", () => {
  it("AppHeader main menu exposes a Motivos link for coordinators", () => {
    const source = readSource("src/shared/presentation/ui/AppHeader.tsx");

    expect(source).toMatch(/href:\s*"\/motivos"/);
    expect(source).toMatch(/label:\s*"Motivos"/);

    // Keep the Especialidades entry too: Motivos sits alongside it, it does not
    // replace it.
    expect(source).toMatch(/href:\s*"\/specialties"/);
  });

  it("dashboard landing grid exposes a Motivos card for coordinators", () => {
    const source = readSource("src/app/(dashboard)/dashboard/page.tsx");

    expect(source).toMatch(/href:\s*"\/motivos"/);
  });
});
