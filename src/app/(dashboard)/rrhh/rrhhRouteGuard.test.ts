import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * RRHH route-access guard (static source guard).
 *
 * The project's vitest environment is `node` with no DOM/jsdom, so the RSC page
 * cannot be rendered. We instead assert the page enforces the access rules
 * required by the spec ("Non-RRHH redirected"):
 *   - unauthenticated -> redirect("/login")
 *   - role !== Role.RRHH -> redirect("/dashboard")
 *
 * The behavioral counterpart (the server action rejecting non-RRHH actors) is
 * covered by shiftActions.rrhh.test.ts.
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

describe("RRHH route guard", () => {
  const source = readFileSync(pagePath, "utf8");

  it("redirects unauthenticated visitors to /login", () => {
    expect(source).toMatch(/if\s*\(!actor\)\s*redirect\("\/login"\)/);
  });

  it("redirects non-RRHH, non-coordinator actors away from /rrhh", () => {
    expect(source).toMatch(
      /actor\.role\s*!==\s*Role\.RRHH\s*&&\s*actor\.role\s*!==\s*Role\.COORDINATOR/,
    );
    expect(source).toMatch(/redirect\("\/dashboard"\)/);
  });

  it("reads the current actor before rendering (server guard, not client)", () => {
    expect(source).toMatch(/getCurrentActor\(\)/);
    expect(source).not.toMatch(/^["']use client["']/m);
  });
});
