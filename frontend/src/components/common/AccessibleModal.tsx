import React, { useEffect, useRef } from "react";
import { trapFocus, announceToScreenReader } from "@/utils/accessibility";

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Announce modal opening to screen readers
      announceToScreenReader(
        `${title} modal opened${description ? `: ${description}` : ""}`
      );

      // Trap focus within the modal
      const cleanup = trapFocus(modalRef.current!);

      // Prevent body scrolling
      document.body.style.overflow = "hidden";

      return () => {
        cleanup();
        document.body.style.overflow = "";
        // Restore focus when modal closes
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, title, description]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      onKeyDown={handleKeyDown}
      open={isOpen}
    >
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          ref={modalRef}
          className={`
            relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all
            sm:my-8 sm:w-full sm:max-w-lg sm:p-6
            ${className}
          `}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal content */}
          <div>
            <h3
              id="modal-title"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              {title}
            </h3>

            {description && (
              <p id="modal-description" className="mt-2 text-sm text-gray-500">
                {description}
              </p>
            )}

            <div className="mt-4">{children}</div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
