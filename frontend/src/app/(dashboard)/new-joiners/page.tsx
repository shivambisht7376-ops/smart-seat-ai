"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Calendar, CheckCircle2, Clock, RefreshCw, UserPlus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { useNewJoiners, useAllocateNewJoiner } from "@/hooks/useAllocations";
import { useAvailableSeats } from "@/hooks/useSeats";
import { useIsHRAdmin } from "@/store/auth";
import { formatDate, initials, cn } from "@/lib/utils";

type NJ = {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  expected_joining_date?: string;
  preferred_floor_name?: string;
  preferred_zone?: string;
  seat_number?: string;
  status: string;
  notes?: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]",
  allocated: "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
  cancelled: "bg-[color-mix(in_srgb,var(--color-muted-foreground)_15%,transparent)] text-[var(--color-muted-foreground)]",
};

function QuickAllocateButton({ nj, isAdmin }: { nj: NJ; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [seatId, setSeatId] = useState("");
  const { data: avail } = useAvailableSeats({});
  const allocMutation = useAllocateNewJoiner();

  if (!isAdmin || nj.status !== "pending") {
    return nj.seat_number
      ? <span className="font-mono text-xs text-[var(--color-primary)] font-bold">{nj.seat_number}</span>
      : <span className="text-[var(--color-muted-foreground)] text-xs">—</span>;
  }

  if (!open) {
    return (
      <Button id={`alloc-nj-${nj.id}`} variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
        onClick={() => setOpen(true)}>
        <CheckCircle2 className="w-3.5 h-3.5" /> Assign Seat
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select value={seatId} onChange={(e) => setSeatId(e.target.value)}
        className="h-7 px-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]">
        <option value="">Select seat…</option>
        {(avail?.items ?? []).slice(0, 30).map((s) => (
          <option key={s.id} value={s.id}>
            {s.seat_number}{s.floor_name ? ` · ${s.floor_name}` : ""}
          </option>
        ))}
      </select>
      <Button id={`confirm-nj-${nj.id}`} variant="brand" size="sm" className="h-7 px-2 text-xs"
        disabled={!seatId || allocMutation.isPending}
        onClick={async () => {
          await allocMutation.mutateAsync({ njId: nj.id, seatId });
          setOpen(false);
        }}>
        Confirm
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>
        ✕
      </Button>
    </div>
  );
}

function buildColumns(isAdmin: boolean): ColumnDef<NJ, unknown>[] {
  return [
    {
      id: "employee", header: "Employee",
      cell: ({ row }) => {
        const nj = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(nj.employee_name ?? "?")}
            </div>
            <div>
              <p className="text-sm font-medium">{nj.employee_name ?? "—"}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{nj.employee_code}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "joining_date", header: "Joining Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
          {row.original.expected_joining_date
            ? formatDate(row.original.expected_joining_date)
            : <span className="text-[var(--color-muted-foreground)]">TBD</span>}
        </div>
      ),
    },
    {
      id: "preference", header: "Preference",
      cell: ({ row }) => {
        const nj = row.original;
        return (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            {nj.preferred_floor_name ?? "Any floor"}
            {nj.preferred_zone && <span> · {nj.preferred_zone}</span>}
          </div>
        );
      },
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      cell: ({ getValue }) => {
        const s = getValue() as string;
        return (
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
            STATUS_STYLES[s] ?? "bg-[var(--color-accent)] text-[var(--color-foreground)]")}>
            {s}
          </span>
        );
      },
    },
    {
      id: "seat", header: "Seat Assigned",
      cell: ({ row }) => <QuickAllocateButton nj={row.original} isAdmin={isAdmin} />,
    },
    {
      id: "added", header: "Added",
      cell: ({ row }) => (
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
  ];
}

export default function NewJoinersPage() {
  const isAdmin = useIsHRAdmin();
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const { data, isLoading, refetch } = useNewJoiners(statusFilter);
  const items = (data?.items ?? []) as NJ[];

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const allocatedCount = items.filter((i) => i.status === "allocated").length;

  const columns = buildColumns(isAdmin);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="page-title">New Joiners Queue</h1>
            <p className="page-subtitle">Manage seat assignments for incoming employees</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Allocation", value: pendingCount, color: "text-[var(--color-warning)]" },
          { label: "Seat Allocated",     value: allocatedCount, color: "text-[var(--color-success)]" },
          { label: "Total in Queue",     value: data?.total ?? 0, color: "text-[var(--color-foreground)]" },
        ].map((k) => (
          <div key={k.label} className="glass-card p-4">
            <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">{k.label}</p>
            <p className={cn("text-2xl font-bold mt-1", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Status filter + refresh */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
          {[
            { label: "All",       value: undefined },
            { label: "Pending",   value: "pending" },
            { label: "Allocated", value: "allocated" },
          ].map((opt) => (
            <button key={String(opt.value)}
              id={`nj-filter-${opt.label.toLowerCase()}`}
              onClick={() => setStatusFilter(opt.value)}
              className={cn("px-3 py-1.5 text-sm transition-colors",
                statusFilter === opt.value
                  ? "bg-[var(--color-primary)] text-white font-medium"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]")}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button id="refresh-nj" variant="ghost" size="icon" className="h-9 w-9" onClick={() => refetch()}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <DataTable columns={columns} data={items} isLoading={isLoading}
          emptyText="No new joiners in the queue." />
      </div>

      {/* Info banner when empty pending */}
      {!isLoading && pendingCount === 0 && statusFilter === "pending" && (
        <div className="glass-card p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--color-foreground)]">All caught up!</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            No pending new joiners awaiting seat allocation.
          </p>
        </div>
      )}
    </div>
  );
}
