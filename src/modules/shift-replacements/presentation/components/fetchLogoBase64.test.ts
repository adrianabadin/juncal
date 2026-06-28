import { describe, it, expect } from "vitest";
import { arrayBufferToBase64 } from "@shift-replacements/presentation/components/fetchLogoBase64";

describe("arrayBufferToBase64", () => {
  it("encodes bytes to the same base64 as a reference encoder", () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const expected = Buffer.from(bytes).toString("base64");

    expect(arrayBufferToBase64(bytes.buffer)).toBe(expected);
  });

  it("encodes an empty buffer to an empty string", () => {
    expect(arrayBufferToBase64(new Uint8Array([]).buffer)).toBe("");
  });

  it("encodes binary PNG-like bytes correctly (round-trips through decode)", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const encoded = arrayBufferToBase64(bytes.buffer);
    const decoded = new Uint8Array(Buffer.from(encoded, "base64"));

    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});
