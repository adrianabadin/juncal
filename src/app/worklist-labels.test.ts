import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Visible-label guard for the worklist rename.
 *
 * The specialty worklist heading is "Listado de Solicitudes" and the
 * coordinator worklist heading is "Gestión de Reemplazos". The dashboard
 * landing cards must use the same labels. These tests fail loudly if the old
 * "Worklist de especialidad" / "Worklist general" labels reappear.
 */

const repoRoot = join(__dirname, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("worklist visible labels", () => {
  it("specialty worklist page heading reads 'Listado de Solicitudes'", () => {
    const source = readSource("src/app/(dashboard)/worklist/page.tsx");
    expect(source).toContain("Listado de Solicitudes");
    expect(source).not.toContain("Worklist de especialidad");
  });

  it("coordinator worklist page heading reads 'Gestión de Reemplazos'", () => {
    const source = readSource("src/app/(dashboard)/coordinator/page.tsx");
    expect(source).toContain("Gestión de Reemplazos");
    expect(source).not.toContain("Worklist general");
  });

  it("dashboard cards use the renamed worklist labels", () => {
    const source = readSource("src/app/(dashboard)/dashboard/page.tsx");
    expect(source).toContain("Listado de Solicitudes");
    expect(source).toContain("Gestión de Reemplazos");
    expect(source).not.toContain("Worklist de especialidad");
    expect(source).not.toContain("Worklist general");
  });
});

describe("AppHeader nav labels", () => {
  it("uses 'Listado de Solicitudes' for the specialty worklist link", () => {
    const source = readSource("src/shared/presentation/ui/AppHeader.tsx");
    expect(source).toContain('label: "Listado de Solicitudes"');
  });

  it("uses 'Gestión de Reemplazos' for the coordinator worklist link", () => {
    const source = readSource("src/shared/presentation/ui/AppHeader.tsx");
    expect(source).toContain('label: "Gestión de Reemplazos"');
  });

  it("does NOT contain the legacy 'Mi especialidad' label", () => {
    const source = readSource("src/shared/presentation/ui/AppHeader.tsx");
    expect(source).not.toContain("Mi especialidad");
  });

  it("does NOT contain the legacy 'General' label as a nav link", () => {
    const source = readSource("src/shared/presentation/ui/AppHeader.tsx");
    expect(source).not.toMatch(/label:\s*"General"/);
  });
});
