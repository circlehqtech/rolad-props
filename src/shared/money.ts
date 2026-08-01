/**
 * High-precision currency utility helpers to manage bigint kobo strings
 * from the backend contract and formats them into user-facing Naira values.
 */

/**
 * Converts a bigint kobo string value from the wire into a standard JavaScript number in Naira.
 * @param kobo Bigint string value, e.g., "118000000"
 */
export function toNaira(kobo: string | null | undefined): number {
  if (!kobo) return 0;
  // Parse string securely using BigInt first to prevent floating point overflow
  try {
    const koboBigInt = BigInt(kobo);
    return Number(koboBigInt) / 100;
  } catch (error) {
    console.error("Failed to parse kobo value:", kobo, error);
    return 0;
  }
}

/**
 * Formats a bigint kobo string value into a localized Nigerian Naira string representation.
 * @param kobo Bigint string value, e.g., "118000000"
 */
export function formatNaira(kobo: string | null | undefined): string {
  const nairaVal = toNaira(kobo);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(nairaVal);
}

/**
 * Converts standard Naira number values into integer kobo representations for POST/PATCH payload submissions.
 * @param naira Naira value as a JS number
 */
export function toKoboInt(naira: number): number {
  if (isNaN(naira) || naira < 0) return 0;
  // Round to prevent decimal floating inaccuracies
  return Math.round(naira * 100);
}
