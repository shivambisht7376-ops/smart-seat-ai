"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, RefreshCw, UserCheck, UserMinus } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { SeatStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAllocations, useReleaseSeat } from "@/hooks/useAllocations";
import { useIsHRAdmin } from "@/store/auth";
import { formatDate, formatDateTime, initials, cn } from "@/lib/utils";
import type { SeatAllocation } from "@/types";
import type { AllocationFilters } from "@/lib/allocations";
import { AllocateSeatModal } from "@/components/allocations/allocate-seat-modal";

function buildColumns(
  onRelease: (a: SeatAllocation) => void,
  canEdit: boolean
): ColumnDef<SeatAllocation, unknown>[] {
  return [
    {
      id: "employee",
      header: "Employee",
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original as SeatAllocation & {
          employee_name?: string; employee_code?: string;
        };
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(a.employee_name ?? "?")}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {a.employee_name ?? "—"}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {a.employee_code}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "seat",
      header: "Seat",
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original as SeatAllocation & {
          seat_number?: string; zone_name?: string;
          floor_name?: string; building_name?: string;
        };
        return (
          <div>
            <p className="font-mono text-sm font-semibold text-[var(--color-primary)]">
              {a.seat_number ?? "—"}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {[a.zone_name, a.floor_name, a.building_name].filter(Boolean).join(" · ")}
            </p>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original as SeatAllocation;
        return a.is_active
          ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />Active
            </span>
          : <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-muted-foreground)_15%,transparent)] text-[var(--color-muted-foreground)]">
              Released
            </span>;
      },
    },
    {
      id: "allocated_date",
      accessorKey: "allocated_date",
      header: "Allocated",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      id: "released_date",
      accessorKey: "released_date",
      header: "Released",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {getValue() ? formatDate(getValue() as string) : "—"}
        </span>
      ),
    },
    {
      id: "allocated_by",
      header: "Allocated By",
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original as SeatAllocation & { allocated_by_name?: string };
        return (
          <span className="text-sm text-[var(--color-muted-foreground)]">
            {a.allocated_by_name ?? "—"}
          </span>
        );
      },
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: SeatAllocation } }) => {
              const a = row.original;
              if (!a.is_active) return null;
              return (
                <div className="flex gap-1 justify-end">
                  <Button
                    id={`release-${a.id}`}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_10%,transparent)]"
                    onClick={(e) => { e.stopPropagation(); onRelease(a); }}
                  >
                    <UserMinus className="w-3.5 h-3.5 mr-1" />Release
                  </Button>
                </div>
              );
            },
          } as ColumnDef<SeatAllocation, unknown>,
        ]
      : []),
  ];
}

export default function AllocationsPage() {
  const isHRAdmin = useIsHRAdmin();
  const [filters, setFilters] = useState<AllocationFilters>({ is_active: undefined, page: 1, page_size: 20 });
  const [showAllocModal, setShowAllocModal] = useState(false);

  const { data, isLoading, refetch } = useAllocations(filters);
  const releaseMutation = useReleaseSeat();

  const handleRelease = async (a: SeatAllocation & { employee_id: string }) => {
    if (confirm("Release this seat allocation? The seat will become available again.")) {
      await releaseMutation.mutateAsync({ employeeId: a.employee_id });
    }
  };

  const columns = buildColumns(
    (a) => handleRelease(a as SeatAllocation & { employee_id: string }),
    isHRAdmin
  );

  const activeCount  = data?.items?.filter((a) => a.is_active).length ?? 0;
  const totalCount   = data?.total ?? 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Seat Allocations</h1>
          <p className="page-subtitle">
            {data?.total != null ? `${data.total} allocation records` : "Loading…"}
          </p>
        </div>
        {isHRAdmin && (
          <Button
            id="allocate-seat-btn"
            variant="brand"
            size="sm"
            className="gap-2"
            onClick={() => setShowAllocModal(true)}
          >
            <UserCheck className="w-4 h-4" />
            Allocate Seat
          </Button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Records", value: totalCount, cls: "text-[var(--color-foreground)]" },
          { label: "Active Allocations", value: data?.items?.filter(a => a.is_active).length ?? 0, cls: "text-[var(--color-success)]" },
          { label: "Released", value: (data?.items?.filter(a => !a.is_active).length ?? 0), cls: "text-[var(--color-muted-foreground)]" },
        ].map((k) => (
          <div key={k.label} className="glass-card p-4">
            <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">{k.label}</p>
            <p className={cn("text-2xl font-bold mt-1", k.cls)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Active filter */}
        <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
          {[
            { label: "All", value: undefined },
            { label: "Active", value: true },
            { label: "Released", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              id={`filter-${opt.label.toLowerCase()}`}
              onClick={() => setFilters((f) => ({ ...f, is_active: opt.value, page: 1 }))}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                filters.is_active === opt.value
                  ? "bg-[var(--color-primary)] text-white font-medium"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Button
            id="refresh-alloc-btn"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={(data?.items ?? []) as SeatAllocation[]}
          isLoading={isLoading}
          emptyText="No allocation records found."
        />
        {data && data.total > 0 && (
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            hasNext={data.page < data.total_pages}
            hasPrev={data.page > 1}
            total={data.total}
            pageSize={data.page_size}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            className="border-t border-[var(--color-border)]"
          />
        )}
      </div>

      <AllocateSeatModal
        open={showAllocModal}
        onClose={() => setShowAllocModal(false)}
      />
    </div>
  );
}
