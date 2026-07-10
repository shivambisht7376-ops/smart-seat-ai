import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { SeatStatus, EmploymentStatus, ProjectStatus } from "@/types";

// ─── Tailwind class merge ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ─────────────────────────────────────────────────────────
export function formatDate(date: string | Date, fmt = "MMM d, yyyy"): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMM d, yyyy h:mm a");
}

export function timeAgo(date: string | Date): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

// ─── Number formatting ────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function formatCurrency(n: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercentage(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ─── Status helpers ──────────────────────────────────────────────────────────
export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  maintenance: "Maintenance",
};

export const SEAT_STATUS_CLASS: Record<SeatStatus, string> = {
  available: "seat-available",
  occupied: "seat-occupied",
  reserved: "seat-reserved",
  maintenance: "seat-maintenance",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  terminated: "Terminated",
};

export const EMPLOYMENT_STATUS_CLASS: Record<EmploymentStatus, string> = {
  active:     "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  inactive:   "bg-[color-mix(in_srgb,var(--color-muted)_60%,transparent)] text-[var(--color-muted-foreground)] border-[var(--color-border)]",
  on_leave:   "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
  terminated: "bg-[color-mix(in_srgb,var(--color-destructive)_15%,transparent)] text-[var(--color-destructive)] border-[color-mix(in_srgb,var(--color-destructive)_30%,transparent)]",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  archived: "Archived",
};

export const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  active:    "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  completed: "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]",
  on_hold:   "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
  cancelled: "bg-[color-mix(in_srgb,var(--color-destructive)_15%,transparent)] text-[var(--color-destructive)] border-[color-mix(in_srgb,var(--color-destructive)_30%,transparent)]",
  archived:  "bg-[color-mix(in_srgb,var(--color-muted)_60%,transparent)] text-[var(--color-muted-foreground)] border-[var(--color-border)]",
};

// ─── String helpers ──────────────────────────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len = 40): string {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

// ─── URL helpers ─────────────────────────────────────────────────────────────
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      qs.set(k, String(v));
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ─── Avatar URL ──────────────────────────────────────────────────────────────
export function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b5bdb&color=fff&bold=true&size=64`;
}

// ─── Role helpers ────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  project_manager: "Project Manager",
  employee: "Employee",
};

export const ROLE_BADGE_CLASS: Record<string, string> = {
  super_admin:     "bg-[color-mix(in_srgb,#7c3aed_12%,transparent)] text-[#7c3aed] border-[color-mix(in_srgb,#7c3aed_25%,transparent)]",
  hr_admin:        "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]",
  project_manager: "bg-[color-mix(in_srgb,#059669_12%,transparent)] text-[#059669] border-[color-mix(in_srgb,#059669_25%,transparent)]",
  employee:        "bg-[color-mix(in_srgb,var(--color-muted-foreground)_12%,transparent)] text-[var(--color-muted-foreground)] border-[var(--color-border)]",
};
