"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[85dvh] sm:rounded-2xl",
          sizeClasses[size],
          className,
        )}
      >
        {title ? (
          <div className="flex shrink-0 flex-col items-center border-b border-border px-5 pt-3 pb-0 sm:pt-0">
            <div
              aria-hidden
              className="mb-3 h-1 w-10 rounded-full bg-border sm:hidden"
            />
            <div className="flex w-full items-center justify-between gap-3 py-3 sm:py-4">
              <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 shrink-0 touch-manipulation rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
