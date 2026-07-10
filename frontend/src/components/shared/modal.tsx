"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  id?: string;
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  id = "modal",
}: ModalProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id={`${id}-overlay`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        id={id}
        className={cn(
          "relative w-full rounded-2xl glass-card shadow-2xl shadow-black/40",
          "border border-[var(--color-border)] bg-[var(--color-card)]",
          "animate-fade-in",
          SIZE_CLASSES[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <div>
            <h2
              id={`${id}-title`}
              className="text-lg font-semibold text-[var(--color-foreground)]"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            id={`${id}-close`}
            onClick={onClose}
            className={cn(
              "ml-4 p-1.5 rounded-lg",
              "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
              "hover:bg-[var(--color-accent)] transition-colors"
            )}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
