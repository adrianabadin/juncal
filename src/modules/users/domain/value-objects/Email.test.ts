import { describe, it, expect } from "vitest";
import { Email } from "@users/domain/value-objects/Email";

describe("Email", () => {
  it("creates a valid email", () => {
    const r = Email.create("doc@sanatorio.com");
    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.value).toBe("doc@sanatorio.com");
  });
  it("rejects invalid email", () => {
    const r = Email.create("not-an-email");
    expect(r.isOk).toBe(false);
  });
});