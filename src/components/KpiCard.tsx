import { type ReactNode } from "react";
import FlatIcon from "./FlatIcon";

interface KpiCardProps {
  title: string;
  value: string | number | ReactNode;
  subtext: string;
  icon: ReactNode;
  variant?: "default" | "risk" | "success" | "warning";
  onClick?: () => void;
  isProminent?: boolean;
  compact?: boolean;
}

export default function KpiCard({
  title,
  value,
  subtext,
  icon,
  variant = "default",
  onClick,
  isProminent = false,
  compact = false,
}: KpiCardProps) {
  const isRisk = variant === "risk";
  const hasLongValue =
    typeof value === "string" && value.replace(/\s/g, "").length >= 12;

  const cardBg = isProminent
    ? "bg-brand-teal text-white border-transparent"
    : "bg-white border border-brand-teal/10 hover:border-brand-teal/25";

  // Color classes for premium light theme using brand palette
  const valueColor = isProminent
    ? "text-white"
    : isRisk
      ? "text-status-missed"
      : "text-charcoal";

  const subtextColor = isProminent
    ? "text-white/80"
    : isRisk
      ? "text-status-missed"
      : "text-muted-gray";

  // Icon container styles matching the light theme rounded border
  const iconContainerStyles = isProminent
    ? "border-white/15 text-white bg-white/12"
    : isRisk
      ? "border-transparent text-brand-coral bg-brand-coral/10"
      : variant === "success"
        ? "border-transparent text-brand-lime bg-brand-lime/12"
        : "border-transparent text-brand-teal bg-[#e7f5f6]";

  return (
    <div
      onClick={onClick}
      className={`metric-card ${cardBg} ${onClick ? "cursor-pointer" : ""} ${
        compact
          ? "min-h-28 p-4"
          : "min-h-[132px] p-5"
      } transition-all duration-200 rounded-2xl flex gap-3 justify-between items-start shadow-sm relative overflow-hidden group`}
    >
      <div className={`${compact ? "space-y-2" : "space-y-2.5"} min-w-0 flex-1 z-10`}>
        {/* Title */}
        <p
          className={`${compact ? "pr-2 text-[10px] leading-3" : "text-[11px]"} font-semibold ${isProminent ? "text-white/75" : "text-muted-gray"}`}
        >
          {title}
        </p>

        {/* Value */}
        <div
          className={`${
            compact
              ? hasLongValue
                ? "text-[16px] 2xl:text-[18px]"
                : "text-[19px] 2xl:text-[22px]"
              : hasLongValue
                ? "metric-card-value-long"
                : "metric-card-value-default"
          } metric-card-value whitespace-nowrap tabular-nums font-bold leading-none mt-2 tracking-tight font-sans ${valueColor}`}
        >
          {value}
        </div>

        {/* Subtext */}
        <p
          className={`${compact ? "text-[9px] leading-3.5" : "text-[10px]"} font-semibold tracking-wide ${subtextColor}`}
        >
          {subtext}
        </p>
      </div>

      {/* Consistent line-icon container */}
      <div
        className={`${
          compact ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-2xl"
        } flex items-center justify-center border ${iconContainerStyles} shrink-0 z-10 [&>svg]:h-5 [&>svg]:w-5`}
      >
        {icon || <FlatIcon name="dashboard" className="text-[18px]" />}
      </div>
    </div>
  );
}
