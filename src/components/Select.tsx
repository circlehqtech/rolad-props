import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import FlatIcon from "./FlatIcon";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function Select({
  options,
  value,
  onChange,
  className = "",
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 180,
    maxHeight: 280,
  });

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < 260 && rect.top > spaceBelow;
      const maxHeight = Math.max(
        160,
        Math.min(320, openAbove ? rect.top - 16 : spaceBelow - 16),
      );

      setMenuPosition({
        top: openAbove
          ? Math.max(8, rect.top - Math.min(280, maxHeight) - 8)
          : rect.bottom + 6,
        left: Math.min(
          rect.left,
          Math.max(8, window.innerWidth - Math.max(rect.width, 180) - 8),
        ),
        width: Math.max(rect.width, 180),
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const isFullWidth = className.includes("w-full");

  return (
    <div
      ref={containerRef}
      className={`relative text-left ${
        isFullWidth ? "w-full block" : "inline-block"
      } ${className}`}
    >
      <div>
        <button
          ref={buttonRef}
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4.5 py-2 text-xs font-semibold bg-white border border-border-warm rounded-lg shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 text-charcoal cursor-pointer min-w-[180px] disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-150"
        >
          <span className="truncate">{selectedOption?.label}</span>
          <FlatIcon
            name="angle-small-down"
            className={`text-[14px] ml-2 text-muted-gray shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isOpen &&
        createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
          }}
          className="z-[1000] overflow-y-auto rounded-xl border border-brand-teal/15 bg-white py-1.5 shadow-[0_18px_48px_rgba(23,35,30,0.18)] animate-scale-up origin-top"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`mx-1 flex w-[calc(100%-0.5rem)] items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-brand-teal text-white"
                    : "text-charcoal hover:bg-brand-teal/8 hover:text-brand-teal"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <FlatIcon
                    name="check"
                    className="text-[12px] text-white shrink-0 ml-1.5"
                  />
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
