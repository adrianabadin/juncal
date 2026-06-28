/**
 * Loads the compact Sanatorio Juncal logo (public/sjuncal-logo.png) and returns
 * it base64-encoded for ExcelJS `addImage`. Used by coordinator and RRHH exports.
 */

const LOGO_URL = "/sjuncal-logo.png";

/** Pure: encodes raw bytes to base64 without browser/Node-specific globals. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa in the browser; Buffer fallback keeps the function usable in tests.
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

/**
 * Fetches the logo asset and returns its base64 payload, or `undefined` if the
 * asset cannot be loaded (export proceeds without the logo header).
 */
export async function fetchLogoBase64(): Promise<string | undefined> {
  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) return undefined;
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
  } catch {
    return undefined;
  }
}
