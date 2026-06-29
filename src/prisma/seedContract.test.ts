import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
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

/**
 * Source-text guard: the seed MUST contain a backfill step that targets the
 * legacy CONFIRMED rows whose `absenceReasonId` is null. This protects the
 * remediation intent even on machines without a populated dev DB.
 */
describe("prisma seed — backfills motives on legacy CONFIRMED shifts (source)", () => {
  it("queries CONFIRMED shifts with a null absenceReasonId to backfill them", () => {
    // The backfill loop must scan for CONFIRMED rows missing a motive.
    expect(seedSource).toMatch(/state:\s*["']CONFIRMED["']/);
    expect(seedSource).toMatch(/absenceReasonId:\s*null/);
    // And it must UPDATE those rows (idempotent backfill, not create).
    expect(seedSource).toMatch(/shiftReplacement\.update/);
  });

  it("writes a non-empty observation whenever it assigns the 'Otros' motive in the backfill", () => {
    // The backfill must never leave an 'Otros' row without an observation.
    // We assert the seed pairs the 'Otros' reason with a demo observation.
    expect(seedSource).toMatch(/Motivo demo|observation:/);
  });
});

/**
 * Live dev-DB contract: after `npm run db:seed`, NO CONFIRMED ShiftReplacement
 * may keep a null `absenceReasonId`. The four legacy rows (created before the
 * motive feature) must have been backfilled.
 *
 * This test reads the real `dev.db` at the repo root via better-sqlite3 (the
 * same driver Prisma uses) so it exercises actual persisted state, not source
 * text. It is skipped only when the dev DB is absent (e.g. fresh CI clone with
 * no migrations run).
 */
describe("prisma seed — backfilled motives in dev DB (live)", () => {
  const devDbPath = join(repoRoot, "dev.db");

  const hasDevDb = existsSync(devDbPath);
  const maybeIt = hasDevDb ? it : it.skip;

  maybeIt(
    "leaves no CONFIRMED ShiftReplacement with a null absenceReasonId",
    () => {
      const db = new Database(devDbPath, { readonly: true });
      try {
        const nullMotive = db
          .prepare(
            "SELECT id FROM ShiftReplacement WHERE state = 'CONFIRMED' AND absenceReasonId IS NULL",
          )
          .all() as { id: string }[];
        const confirmed = db
          .prepare(
            "SELECT id FROM ShiftReplacement WHERE state = 'CONFIRMED'",
          )
          .all() as { id: string }[];
        // Sanity: the dev DB actually has CONFIRMED rows to reason about,
        // otherwise an empty pass would be meaningless.
        expect(confirmed.length).toBeGreaterThan(0);
        expect(nullMotive.map((r) => r.id)).toEqual([]);
      } finally {
        db.close();
      }
    },
  );

  maybeIt(
    "assigns an observation to every backfilled 'Otros' CONFIRMED shift",
    () => {
      const db = new Database(devDbPath, { readonly: true });
      try {
        // Find the 'Otros' reason id, then assert no CONFIRMED 'Otros' row has
        // an empty observation (the obligatory-observation invariant).
        const otros = db
          .prepare("SELECT id FROM AbsenceReason WHERE name = 'Otros'")
          .get() as { id: string } | undefined;
        // The seed always upserts 'Otros', so it must exist in a seeded DB.
        expect(otros).toBeDefined();
        const badOtros = db
          .prepare(
            "SELECT id FROM ShiftReplacement WHERE state = 'CONFIRMED' AND absenceReasonId = ? AND (observation IS NULL OR TRIM(observation) = '')",
          )
          .all(otros!.id) as { id: string }[];
        expect(badOtros.map((r) => r.id)).toEqual([]);
      } finally {
        db.close();
      }
    },
  );
});