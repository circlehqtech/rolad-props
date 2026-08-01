/**
 * Formatting utility to convert raw developer identifiers, snake_case, camelCase,
 * or SCREAMING_SNAKE_CASE code constants into clean, user-friendly Title Case text.
 *
 * Example transformations:
 *  "payment_status" -> "Payment Status"
 *  "ON_TRACK"       -> "On Track"
 *  "DUE_SOON"       -> "Due Soon"
 *  "land_property"   -> "Land & Property"
 *  "in_progress"    -> "In Progress"
 */
export function formatLabel(str?: string | null): string {
  if (!str) return "";

  const overrides: Record<string, string> = {
    payment_status: "Payment Status",
    paymentStatus: "Payment Status",
    product_type: "Product Type",
    productType: "Product Type",
    land_property: "Land & Property",
    landProperty: "Land & Property",
    ON_TRACK: "On Track",
    DUE_SOON: "Due Soon",
    LATE: "Late",
    MISSED: "Missed",
    in_progress: "In Progress",
    inProgress: "In Progress",
    sortBy: "Sort By",
    sort_by: "Sort By",
    overdue: "Overdue Amount",
    outstanding: "Outstanding Amount",
    whatsapp: "WhatsApp",
    sms: "SMS",
    email: "Email",
  };

  if (overrides[str]) {
    return overrides[str];
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
