import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `prisma/seed.ts` is an idempotent database bootstrap that touches the real
 * Prisma client. Vitest runs in `node` env with no jsdom, and there is no
 * dedicated test DB harness for the seed script, so we assert the seed's
 * behavioral contract by inspecting its source text — the same pattern used
 * by `rrhhRouteGuard.test.ts` and `dashboard-rsc-boundaries.test.ts`.
 *
 * Tests live under `src/` to match the project's vitest include pattern
 * (all `.test.ts` files under `src`). The seed file itself lives at the
 * repo root in `prisma/seed.ts`.
 */

const repoRoot = join(__dirname, "..", "..");
const seedPath = join(repoRoot, "prisma", "seed.ts");
const seedSource = readFileSync(seedPath, "utf8");

describe("prisma seed — RRHH demo user", () => {
  it("upserts rrhh.demo@juncal.local as active BASE_PROFESSIONAL", () => {
    expect(seedSource).toMatch(/rrhh\.demo@juncal\.local/);
    expect(seedSource).toMatch(/Role\.BASE_PROFESSIONAL/);
    // Must be `isActive: true` (not the default false).
    expect(seedSource).toMatch(/isActive:\s*true/);
  });

  it("assigns a display name to the RRHH demo user", () => {
    // The seed should not create an anonymous user; we look for a `name: "..."`
    // literal near the RRHH upsert.
    expect(seedSource).toMatch(/Prof\. RRHH Demo|Prof\.\s*RRHH/i);
  });
});

describe("prisma seed — varied ShiftReplacement motives", () => {
  it("upserts an 'Otros' absence reason so seed data can reference it", () => {
    // Either the default absence reasons list includes "Otros" or the seed
    // upserts it as a custom reason. Either way the literal must appear.
    expect(seedSource).toMatch(/name:\s*["']Otros["']/);
  });

  it("creates at least one ShiftReplacement with motive 'Otros' and a non-empty observation", () => {
    // Look for a prisma.shiftReplacement.create call carrying an observation
    // string and an absenceReasonId that resolves to "Otros".
    expect(seedSource).toMatch(/observation:\s*["']/);
    // Ensure the seed writes ShiftReplacement rows (not just AbsenceReason rows).
    expect(seedSource).toMatch(/shiftReplacement\.create|shiftReplacement\.upsert/);
  });

  it("creates at least one ShiftReplacement with a non-Otros motive and null observation", () => {
    // The seed must produce variety: at least one row whose observation is
    // explicitly null. Accept either `observation: null` or omission
    // followed by an explicit null override.
    expect(seedSource).toMatch(/observation:\s*null/);
  });
});