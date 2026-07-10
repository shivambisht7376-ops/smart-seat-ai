"use client";

import { cn } from "@/lib/utils";
import type { EmploymentStatus, SeatStatus, ProjectStatus } from "@/types";
import {
  SEAT_STATUS_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUS_CLASS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CLASS,
  ROLE_LABELS,
  ROLE_BADGE_CLASS,
} from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

// ─── Employment Status ─────────────────────────────────────────────
export function EmploymentStatusBadge({
  status,
  className,
}: {
  status: EmploymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        EMPLOYMENT_STATUS_CLASS[status] ??
          "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        className
      )}
    >
      {EMPLOYMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Seat Status ──────────────────────────────────────────────────
export function SeatStatusBadge({
  status,
  className,
}: {
  status: SeatStatus;
  className?: string;
}) {
  const cls: Record<SeatStatus, string> = {
    available: "seat-available",
    occupied: "seat-occupied",
    reserved: "seat-reserved",
    maintenance: "seat-maintenance",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        cls[status],
        className
      )}
    >
      {SEAT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Project Status ───────────────────────────────────────────────
export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        PROJECT_STATUS_CLASS[status] ??
          "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        className
      )}
    >
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────
export function RoleBadge({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        ROLE_BADGE_CLASS[role] ??
          "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        className
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ─── Boolean Pill ─────────────────────────────────────────────────
export function BooleanBadge({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        value
          ? "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]"
          : "bg-[color-mix(in_srgb,var(--color-muted)_60%,transparent)] text-[var(--color-muted-foreground)] border-[var(--color-border)]"
      )}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}
