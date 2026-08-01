import React, { type ButtonHTMLAttributes, forwardRef } from "react";
import FlatIcon from "./FlatIcon";

export type ButtonVariant = "primary" | "secondary" | "inverted" | "outlined";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Base classes for typography, layout, focus states
    const baseClasses =
      "inline-flex items-center justify-center font-sans font-semibold rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-teal/20 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px";

    // Variant styles matching the design guide screenshot
    const variantClasses = {
      primary:
        "bg-brand-teal text-white hover:bg-[#087d88] active:bg-brand-teal/90 border border-brand-teal shadow-sm shadow-brand-teal/15",
      secondary:
        "bg-[#edf5f6] text-charcoal hover:bg-[#deedef] active:bg-[#d7e8ea] border border-[#dce9eb]",
      inverted:
        "bg-[#232323] text-white hover:bg-[#232323]/95 active:bg-black border border-[#232323]",
      outlined:
        "bg-white border border-brand-teal/35 text-brand-teal hover:bg-brand-teal/5 active:bg-brand-teal/10",
    };

    // Sizes setup
    const sizeClasses = {
      sm: "px-3 py-1.5 text-[11px] gap-1.5",
      md: "px-4 py-2.5 text-xs gap-2",
      lg: "px-5 py-3 text-sm gap-2.5",
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading && (
          <FlatIcon name="spinner" className="text-[14px] animate-spin shrink-0" />
        )}
        {!isLoading && icon && iconPosition === "left" && (
          <span className="shrink-0 flex items-center">{icon}</span>
        )}
        <span>{children}</span>
        {!isLoading && icon && iconPosition === "right" && (
          <span className="shrink-0 flex items-center">{icon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
