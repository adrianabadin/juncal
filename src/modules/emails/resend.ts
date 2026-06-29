import { Resend } from "resend";

/**
 * Lazy Resend client. The constructor reads `RESEND_API_KEY` from the
 * environment — defer construction until the first caller actually needs an
 * email so the module can be imported during `next build`'s page-data
 * collection (no env vars are present in that context).
 *
 * Test surface: `getResend()` — see `resend.test.ts`.
 */

let client: Resend | null = null;

export function getResend(): Resend {
  if (client === null) {
    client = new Resend(process.env["RESEND_API_KEY"]);
  }
  return client;
}
