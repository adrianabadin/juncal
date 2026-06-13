import { describe, it, expect } from "vitest";
import { ok, err } from "@shared/domain/Result";

describe("Result", () => {
  it("ok carries a value", () => {
    const r = ok(42);
    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value).toBe(42);
  });
  it("err carries an error", () => {
    const r = err("boom");
    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error).toBe("boom");
  });
});
