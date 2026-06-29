import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static-source contract tests for Docker deployment artifacts.
 *
 * These tests assert that the Dockerfile and docker-compose.yml contain the
 * required directives for production deployment on a VPS with SQLite.
 */

const repoRoot = join(__dirname, "..", "..");

function readRootFile(filename: string): string {
  return readFileSync(join(repoRoot, filename), "utf8");
}

describe("Dockerfile contract", () => {
  it("exists at repo root", () => {
    const content = readRootFile("Dockerfile");
    expect(content).toBeTruthy();
  });

  it("contains a HEALTHCHECK directive", () => {
    const content = readRootFile("Dockerfile");
    expect(content.toLowerCase()).toContain("healthcheck");
  });

  it("runs as a non-root user", () => {
    const content = readRootFile("Dockerfile");
    expect(content).toMatch(/USER\s+\w+/);
  });

  it("exposes port 3000", () => {
    const content = readRootFile("Dockerfile");
    expect(content).toContain("EXPOSE 3000");
  });

  it("runs prisma generate during build", () => {
    const content = readRootFile("Dockerfile");
    expect(content).toContain("prisma generate");
  });

  it("runs prisma migrate deploy in entrypoint/cmd", () => {
    const content = readRootFile("Dockerfile");
    expect(content).toContain("prisma migrate deploy");
  });

  it("uses multi-stage build (at least two FROM ... AS)", () => {
    const content = readRootFile("Dockerfile");
    const fromAsMatches = content.match(/FROM\s+\S+\s+AS\s+\S+/gi);
    expect(fromAsMatches).not.toBeNull();
    expect(fromAsMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it("uses a pinned node:22 base image", () => {
    const content = readRootFile("Dockerfile");
    expect(content).toMatch(/FROM\s+node:22[-\.]/);
  });
});

describe("docker-compose.yml contract", () => {
  it("exists at repo root", () => {
    const content = readRootFile("docker-compose.yml");
    expect(content).toBeTruthy();
  });

  it("contains a services block", () => {
    const content = readRootFile("docker-compose.yml");
    expect(content).toContain("services:");
  });

  it("contains a healthcheck block", () => {
    const content = readRootFile("docker-compose.yml");
    expect(content).toContain("healthcheck:");
  });

  it("declares the juncal-data named volume", () => {
    const content = readRootFile("docker-compose.yml");
    expect(content).toContain("juncal-data");
  });

  it("mounts the prisma data directory", () => {
    const content = readRootFile("docker-compose.yml");
    expect(content).toMatch(/app\/prisma\/data/);
  });
});
