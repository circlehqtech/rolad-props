export type PaymentStatusCode = "ON_TRACK" | "DUE_SOON" | "LATE" | "MISSED";

export interface PaymentStatusMeta {
  label: string;
  color: string; // Hex code
  bg: string;    // Tailwind bg class or inline bg color style helper
  textClass: string;
}

/**
 * Returns UI metadata (label, color, bg classes) based on PaymentStatusCode from server.
 * Handles null (no visibility for Marketing officer role).
 */
export function paymentStatusMeta(code: PaymentStatusCode | null | undefined): PaymentStatusMeta {
  if (!code) {
    return {
      label: "No Visibility",
      color: "#9ca3af",
      bg: "bg-neutral-100",
      textClass: "text-neutral-500",
    };
  }

  switch (code) {
    case "ON_TRACK":
      return {
        label: "On Track",
        color: "#10b981",
        bg: "bg-status-on-track/10",
        textClass: "text-status-on-track",
      };
    case "DUE_SOON":
      return {
        label: "Due Soon",
        color: "#f59e0b",
        bg: "bg-amber-100",
        textClass: "text-amber-600",
      };
    case "LATE":
      return {
        label: "Late",
        color: "#f97316",
        bg: "bg-status-late/10",
        textClass: "text-status-late",
      };
    case "MISSED":
      return {
        label: "Missed",
        color: "#ef4444",
        bg: "bg-status-missed/10",
        textClass: "text-status-missed",
      };
    default:
      return {
        label: code,
        color: "#9ca3af",
        bg: "bg-neutral-100",
        textClass: "text-neutral-500",
      };
  }
}
