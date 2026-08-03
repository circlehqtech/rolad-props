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
 * Formats a Naira number into a compact abbreviated string.
 * e.g. 1_000_000 → "₦1M", 2_500_000_000 → "₦2.5B", 31_250_999 → "₦31.3M"
 * @param naira Naira value as a JS number
 */
export function formatCompactNaira(naira: number): string {
  const abs = Math.abs(naira);
  const sign = naira < 0 ? "-" : "";

  if (abs >= 1_000_000_000_000) {
    const val = naira / 1_000_000_000_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.0$/, "");
    return `${sign}₦${formatted}T`;
  }
  if (abs >= 1_000_000_000) {
    const val = naira / 1_000_000_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.0$/, "");
    return `${sign}₦${formatted}B`;
  }
  if (abs >= 1_000_000) {
    const val = naira / 1_000_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.0$/, "");
    return `${sign}₦${formatted}M`;
  }
  if (abs >= 1_000) {
    const val = naira / 1_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.0$/, "");
    return `${sign}₦${formatted}K`;
  }
  return `${sign}₦${naira.toLocaleString()}`;
}

/**
 * Formats a bigint kobo string value into a compact Naira string for display.
 * e.g. "3125099900" → "₦31.3M"
 * @param kobo Bigint string value, e.g., "118000000"
 */
export function formatNaira(kobo: string | null | undefined): string {
  return formatCompactNaira(toNaira(kobo));
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
