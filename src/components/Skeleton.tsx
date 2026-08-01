import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-neutral-200/40 dark:bg-neutral-800/30 rounded";

  const variantClasses = {
    text: "h-3.5 w-full my-1 rounded-sm",
    rectangular: "",
    circular: "rounded-full",
  };

  const style: React.CSSProperties = {
    width,
    height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}
