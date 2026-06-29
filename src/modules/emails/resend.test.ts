import { describe, expect, it, vi } from "vitest";

/**
 * The Resend client MUST NOT be constructed at module load. `next build`
 * evaluates server modules for page-data collection (e.g. /api/cron) and a
 * top-level `new Resend(process.env.RESEND_API_KEY)` throws when RESEND_API_KEY
 * is undefined — which is the production build context. The factory gate
 * defers construction until the first caller actually needs an email.
 */

const constructorSpy = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    constructor(...args: unknown[]) {
      constructorSpy(...args);
    }
  },
}));

// Static import — `vi.mock` is hoisted above this import so the mocked
// `Resend` class is what runs when `./resend` evaluates.
import * as resendModule from "./resend";

describe("resend client — lazy instantiation", () => {
  it("does not call new Resend on module import", () => {
    expect(constructorSpy).not.toHaveBeenCalled();
  });

  it("calls new Resend the first time getResend() is invoked", () => {
    const before = constructorSpy.mock.calls.length;
    resendModule.getResend();
    expect(constructorSpy.mock.calls.length).toBeGreaterThan(before);
  });

  it("reuses a single client across multiple getResend() calls", () => {
    const before = constructorSpy.mock.calls.length;
    resendModule.getResend();
    resendModule.getResend();
    resendModule.getResend();
    expect(constructorSpy.mock.calls.length).toBe(before);
  });
});
