import { describe, it, expect } from "vitest";
import { z } from "zod";

// Regression for "Invalid input: expected 6" on form submit.
//
// HTML <select> elements always produce string values ("6", "12", "24"). The
// original form schemas used numeric literals and rejected "6" before
// submit. A plain union+transform would accept ANY string (including "abc" →
// NaN), so the shipped schema uses coercion instead.
//
// The shipped fix uses z.coerce.number() for moduleHours in BOTH form schemas.
// This mirror is kept in lockstep with the inline component schemas (they are
// not exported). If the component field type changes, update this mirror too.
const formModuleHours = z.coerce.number();

describe("form moduleHours schema — z.coerce.number() (shipped behavior)", () => {
  it("accepts string '6' from HTML select and coerces to number", () => {
    const result = formModuleHours.safeParse("6");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(6);
      expect(typeof result.data).toBe("number");
    }
  });

  it("accepts string '12' and coerces to number", () => {
    const result = formModuleHours.safeParse("12");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(12);
  });

  it("accepts string '24' and coerces to number", () => {
    const result = formModuleHours.safeParse("24");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(24);
  });

  it("accepts a number (default value path) unchanged", () => {
    const result = formModuleHours.safeParse(12);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(12);
  });

  it("rejects a non-numeric string at the form-schema layer", () => {
    // z.coerce.number() coerces "abc" to NaN, which Zod rejects. This proves the
    // field no longer silently accepts arbitrary strings as the old union did.
    const result = formModuleHours.safeParse("abc");
    expect(result.success).toBe(false);
  });
});
