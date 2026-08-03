import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  /** Whether the modal is currently open */
  open: boolean;
  /** Called when the modal should close (X button, backdrop click, Escape key) */
  onClose: () => void;
  /** Modal heading */
  title: string;
  /** Optional subtitle/description beneath the title */
  description?: string;
  /** Modal body content */
  children: ReactNode;
  /** Max width class, defaults to max-w-lg */
  maxWidth?: string;
}

/**
 * Accessible modal dialog:
 *  - Closes on Escape key, backdrop click, or explicit close button
 *  - Traps focus within the dialog while open
 *  - Returns focus to the trigger element on close
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Capture the currently-focused element before opening so we can restore it on close
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      // Move focus into the dialog after paint
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
    } else {
      // Restore focus to whatever triggered the modal
      previousFocus.current?.focus();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Basic focus trap: keep Tab inside the dialog
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close on backdrop click (not on dialog itself)
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`bg-white border border-border-warm w-full ${maxWidth} rounded-2xl shadow-xl overflow-hidden animate-scale-up max-h-[85vh] flex flex-col outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-4 p-6 border-b border-border-warm shrink-0">
          <div>
            <h2 className="font-serif text-base font-bold text-brand-teal">
              {title}
            </h2>
            {description && (
              <p className="text-[11px] text-muted-gray mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-muted-gray hover:text-charcoal p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
