import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * /rrhh approved-replacements table column contract.
 *
 * The project's vitest environment is `node` with no DOM/jsdom, so we cannot
 * render the RSC page. We assert the page source enforces the column contract
 * required by the spec:
 *   - "Estado" and "Acciones" columns are GONE (no longer useful, read-only).
 *   - "Motivo" column is rendered using each shift's `reasonName`.
 *   - "Observación" column is rendered only for shifts whose motive is `Otros`.
 *   - The route-guard regex used by rrhhRouteGuard.test.ts is preserved.
 *
 * Source-level checks are the project's established pattern (see
 * rrhhRouteGuard.test.ts and dashboard-rsc-boundaries.test.ts).
 */

const pagePath = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "src",
  "app",
  "(dashboard)",
  "rrhh",
  "page.tsx",
);

const pageSource = readFileSync(pagePath, "utf8");

// Match a table <th>...</th> cell whose text content equals (case-sensitive,
// allowing nested JSX/whitespace) the given label.
function hasHeader(label: string): boolean {
  // Look for: <th ...> ... <label> ...
  // Tolerate intermediate JSX, attributes, expressions.
  const re = new RegExp(
    `<th[^>]*>(?:[^<]|<(?!/?th>))*${label}(?:[^<]|<(?!/?th>))*</th>`,
    "m",
  );
  return re.test(pageSource);
}

function hasColGroup(labels: string[]): boolean {
  return labels.every(hasHeader);
}

describe("RRHH table — Motivo / Observación column contract", () => {
  it("renders the new Motivo column", () => {
    expect(hasHeader("Motivo")).toBe(true);
  });

  it("renders the Observación column", () => {
    expect(hasHeader("Observación")).toBe(true);
  });

  it("preserves the expected baseline columns", () => {
    expect(
      hasColGroup([
        "Fecha",
        "Especialidad",
        "Solicitante",
        "Entrada",
        "Salida",
        "Módulo",
        "Bajo Factura",
        "Coberturas",
      ]),
    ).toBe(true);
  });

  it("hides the legacy Estado column", () => {
    expect(hasHeader("Estado")).toBe(false);
  });

  it("hides the legacy Acciones column", () => {
    expect(hasHeader("Acciones")).toBe(false);
  });

  it("renders the Motivo cell value from shift.reasonName", () => {
    // The row must reference `shift.reasonName` (server-resolved motive).
    // We accept either direct rendering or a helper that resolves via
    // reasonNameById (server has both forms). The chosen decision per
    // sdd/rrhh-dashboard-export-motivos/decision/motive-dto is the direct
    // reasonName field on the DTO, so we expect that form here.
    expect(pageSource).toMatch(/shift\.reasonName|reasonNameById\.get/);
  });

  it("renders the Observación cell only when reason is 'Otros'", () => {
    // The row logic must branch on Otros — either by checking the resolved
    // name equals "Otros" or by checking the absence reason id resolves to
    // the same. Accept any of these equivalent forms.
    const hasOtrosBranch =
      /shift\.reasonName\s*===\s*["']Otros["']/.test(pageSource) ||
      /shift\.reasonName\s*===\s*["']Otros["']\s*\|\|\s*[\s\S]*?reasonNameById/.test(
        pageSource,
      ) ||
      /reasonNameById\.get\([^)]+\)\s*===\s*["']Otros["']/.test(pageSource);
    expect(hasOtrosBranch).toBe(true);
  });
});

describe("RRHH table — access guard preserved", () => {
  // Regression guard: the route-guard regex from rrhhRouteGuard.test.ts must
  // keep matching after the redesign.
  it("redirects unauthenticated visitors to /login", () => {
    expect(pageSource).toMatch(/if\s*\(!actor\)\s*redirect\("\/login"\)/);
  });

  it("redirects non-RRHH non-coordinator actors away from /rrhh", () => {
    expect(pageSource).toMatch(
      /actor\.role\s*!==\s*Role\.RRHH\s*&&\s*actor\.role\s*!==\s*Role\.COORDINATOR/,
    );
    expect(pageSource).toMatch(/redirect\("\/dashboard"\)/);
  });

  it("stays a Server Component (no 'use client' directive)", () => {
    expect(pageSource).not.toMatch(/^["']use client["']/m);
  });
});