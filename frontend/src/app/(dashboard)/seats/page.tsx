"use client";

import { useState } from "react";
import {
  Building2, Grid3X3, LayoutGrid, List, Plus, RefreshCw,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { SeatStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  useSeats, useSeatUtilization, useBuildings, useFloors, useZones,
  useDeleteSeat,
} from "@/hooks/useSeats";
import { useIsHRAdmin } from "@/store/auth";
import { formatNumber, cn } from "@/lib/utils";
import type { Seat, SeatStatus } from "@/types";
import type { SeatFilters } from "@/lib/seats";

// ─── Seat Grid Card ──────────────────────────────────────────────────────────
function SeatCard({ seat, onEdit, canEdit }: {
  seat: Seat;
  onEdit: (s: Seat) => void;
  canEdit: boolean;
}) {
  const statusColors: Record<SeatStatus, string> = {
    available:   "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]",
    occupied:    "border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]",
    reserved:    "border-[color-mix(in_srgb,var(--color-warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)]",
    maintenance: "border-[color-mix(in_srgb,var(--color-destructive)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-destructive)_8%,transparent)]",
  };
  const dotColors: Record<SeatStatus, string> = {
    available:   "bg-[var(--color-success)]",
    occupied:    "bg-[var(--color-primary)]",
    reserved:    "bg-[var(--color-warning)]",
    maintenance: "bg-[var(--color-destructive)]",
  };

  return (
    <button
      id={`seat-card-${seat.id}`}
      onClick={() => canEdit && onEdit(seat)}
      className={cn(
        "relative group flex flex-col items-center justify-center",
        "w-full aspect-square rounded-xl border-2 p-2",
        "transition-all duration-150",
        canEdit && "hover:scale-105 hover:shadow-lg cursor-pointer",
        !canEdit && "cursor-default",
        statusColors[seat.status as SeatStatus] ?? statusColors.available,
      )}
      title={seat.status === "occupied" ? seat.current_employee_name ?? seat.seat_number : seat.seat_number}
    >
      {/* Status dot */}
      <div className={cn(
        "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
        dotColors[seat.status as SeatStatus]
      )} />

      {/* Seat number */}
      <span className="text-xs font-bold text-[var(--color-foreground)] leading-none">
        {seat.seat_number}
      </span>

      {/* Occupant name (truncated) */}
      {seat.current_employee_name && (
        <span className="text-[9px] text-[var(--color-muted-foreground)] mt-0.5 truncate w-full text-center leading-none px-0.5">
          {seat.current_employee_name.split(" ")[0]}
        </span>
      )}

      {/* Type icon */}
      <span className="text-[9px] text-[var(--color-muted-foreground)] mt-0.5 uppercase tracking-widest">
        {seat.seat_type === "standard" ? "" : seat.seat_type.replace("_", " ")}
      </span>
    </button>
  );
}

// ─── Table columns ─────────────────────────────────────────────────────────
function buildColumns(
  onEdit: (s: Seat) => void,
  onDelete: (s: Seat) => void,
  canEdit: boolean
): ColumnDef<Seat, unknown>[] {
  return [
    {
      id: "seat_number", accessorKey: "seat_number", header: "Seat #", enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
          {getValue() as string}
        </span>
      ),
    },
    {
      id: "location", header: "Location", enableSorting: false,
      cell: ({ row }) => {
        const s = row.original as Seat & {
          zone_name?: string; floor_name?: string; building_name?: string;
        };
        return (
          <div className="text-sm">
            <p className="font-medium">{s.zone_name ?? "—"}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {[s.floor_name, s.building_name].filter(Boolean).join(" · ")}
            </p>
          </div>
        );
      },
    },
    {
      id: "seat_type", accessorKey: "seat_type", header: "Type", enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm capitalize">{(getValue() as string).replace("_", " ")}</span>
      ),
    },
    {
      id: "status", accessorKey: "status", header: "Status", enableSorting: true,
      cell: ({ getValue }) => <SeatStatusBadge status={getValue() as SeatStatus} />,
    },
    {
      id: "occupant", header: "Occupant", enableSorting: false,
      cell: ({ row }) => {
        const s = row.original as Seat & {
          current_employee_name?: string; current_employee_code?: string;
        };
        return s.current_employee_name ? (
          <div className="text-sm">
            <p className="font-medium">{s.current_employee_name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{s.current_employee_code}</p>
          </div>
        ) : <span className="text-[var(--color-muted-foreground)] text-sm">—</span>;
      },
    },
    ...(canEdit ? [{
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }: { row: { original: Seat } }) => (
        <div className="flex gap-1 justify-end">
          <Button id={`edit-seat-${row.original.id}`} variant="ghost" size="sm" className="h-7 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}>Edit</Button>
          <Button id={`del-seat-${row.original.id}`} variant="ghost" size="sm"
            className="h-7 px-2 text-xs text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_10%,transparent)]"
            onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}>Delete</Button>
        </div>
      ),
    } as ColumnDef<Seat, unknown>] : []),
  ];
}

// ─── Main Page ─────────────────────────────────────────────────────────────
type ViewMode = "grid" | "table";

export default function SeatsPage() {
  const isHRAdmin = useIsHRAdmin();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<SeatFilters>({ page: 1, page_size: 50 });
  const [search, setSearch] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | undefined>();
  const [selectedFloorId, setSelectedFloorId] = useState<number | undefined>();
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();

  const { data: seatData, isLoading, refetch } = useSeats({
    ...filters,
    search: search || undefined,
    building_id: selectedBuildingId,
    floor_id: selectedFloorId,
    zone_id: selectedZoneId,
  });
  const { data: utilization = [] } = useSeatUtilization();
  const { data: buildings = [] } = useBuildings();
  const { data: floors = [] } = useFloors(selectedBuildingId);
  const { data: zones = [] } = useZones(selectedFloorId);
  const deleteMutation = useDeleteSeat();

  const handleDelete = async (seat: Seat) => {
    if (confirm(`Delete seat ${seat.seat_number}?`)) {
      await deleteMutation.mutateAsync(seat.id);
    }
  };

  const columns = buildColumns(
    (s) => console.log("edit", s),
    handleDelete,
    isHRAdmin
  );

  // Status counts from utilization data
  const totals = utilization.reduce(
    (acc, f) => ({
      total: acc.total + f.total,
      available: acc.available + f.available,
      occupied: acc.occupied + f.occupied,
      reserved: acc.reserved + f.reserved,
    }),
    { total: 0, available: 0, occupied: 0, reserved: 0 }
  );

  const kpiCards = [
    { label: "Total Seats", value: totals.total, color: "text-[var(--color-foreground)]", dot: "bg-[var(--color-muted-foreground)]" },
    { label: "Available", value: totals.available, color: "text-[var(--color-success)]", dot: "bg-[var(--color-success)]" },
    { label: "Occupied", value: totals.occupied, color: "text-[var(--color-primary)]", dot: "bg-[var(--color-primary)]" },
    { label: "Reserved", value: totals.reserved, color: "text-[var(--color-warning)]", dot: "bg-[var(--color-warning)]" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Seat Management</h1>
          <p className="page-subtitle">Manage floors, zones, and seat allocations across all buildings</p>
        </div>
        {isHRAdmin && (
          <Button id="add-seat-btn" variant="brand" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Seat
          </Button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <div key={k.label} className="glass-card p-4 flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", k.dot)} />
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">{k.label}</p>
              <p className={cn("text-xl font-bold", k.color)}>{formatNumber(k.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Floor utilization bars */}
      {utilization.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            Floor Utilization
          </h2>
          <div className="space-y-3">
            {utilization.map((f) => (
              <div key={f.floor_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {f.building_name} · {f.floor_name}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-primary)]">
                    {f.utilization_pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                    style={{ width: `${f.utilization_pct}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-[var(--color-muted-foreground)]">
                  <span className="text-[var(--color-success)]">✓ {f.available} avail</span>
                  <span className="text-[var(--color-primary)]">● {f.occupied} occ</span>
                  {f.reserved > 0 && <span className="text-[var(--color-warning)]">◆ {f.reserved} res</span>}
                  {f.maintenance > 0 && <span className="text-[var(--color-destructive)]">✗ {f.maintenance} maint</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch}
          placeholder="Search seat number…" className="w-56" id="seat-search" />

        {/* Building */}
        <select id="building-filter" value={selectedBuildingId ?? ""}
          onChange={(e) => {
            setSelectedBuildingId(e.target.value ? Number(e.target.value) : undefined);
            setSelectedFloorId(undefined);
            setSelectedZoneId(undefined);
          }}
          className={cn("h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]")}>
          <option value="">All Buildings</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Floor */}
        <select id="floor-filter" value={selectedFloorId ?? ""}
          onChange={(e) => {
            setSelectedFloorId(e.target.value ? Number(e.target.value) : undefined);
            setSelectedZoneId(undefined);
          }}
          className={cn("h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]")}>
          <option value="">All Floors</option>
          {floors.map((f) => <option key={f.id} value={f.id}>{f.name ?? `Floor ${f.floor_number}`}</option>)}
        </select>

        {/* Zone */}
        <select id="zone-filter" value={selectedZoneId ?? ""}
          onChange={(e) => setSelectedZoneId(e.target.value ? Number(e.target.value) : undefined)}
          className={cn("h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]")}>
          <option value="">All Zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>

        {/* Status */}
        <select id="status-filter" value={filters.status ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
          className={cn("h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]")}>
          <option value="">All Statuses</option>
          {["available", "occupied", "reserved", "maintenance"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <Button id="refresh-seats-btn" variant="ghost" size="icon" className="h-9 w-9"
            onClick={() => refetch()}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          {/* View toggle */}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button id="view-grid-btn" onClick={() => setViewMode("grid")}
              className={cn("px-2.5 py-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button id="view-table-btn" onClick={() => setViewMode("table")}
              className={cn("px-2.5 py-1.5 transition-colors",
                viewMode === "table"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]")}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="glass-card p-5">
          {isLoading ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          ) : (seatData?.items ?? []).length === 0 ? (
            <p className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">
              No seats found. Adjust your filters or add seats.
            </p>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {(seatData?.items ?? []).map((seat) => (
                <SeatCard key={seat.id} seat={seat as Seat}
                  onEdit={(s) => console.log("edit", s)} canEdit={isHRAdmin} />
              ))}
            </div>
          )}
          {seatData && seatData.total > 0 && (
            <Pagination page={seatData.page} totalPages={seatData.pages}
              hasNext={seatData.page < seatData.pages} hasPrev={seatData.page > 1}
              total={seatData.total} pageSize={seatData.page_size}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              className="border-t border-[var(--color-border)] mt-4 pt-2" />
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="glass-card overflow-hidden">
          <DataTable columns={columns} data={(seatData?.items ?? []) as Seat[]}
            isLoading={isLoading} emptyText="No seats found. Try adjusting your filters." />
          {seatData && seatData.total > 0 && (
            <Pagination page={seatData.page} totalPages={seatData.pages}
              hasNext={seatData.page < seatData.pages} hasPrev={seatData.page > 1}
              total={seatData.total} pageSize={seatData.page_size}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              className="border-t border-[var(--color-border)]" />
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-[var(--color-muted-foreground)]">
        {[
          { label: "Available", cls: "bg-[var(--color-success)]" },
          { label: "Occupied", cls: "bg-[var(--color-primary)]" },
          { label: "Reserved", cls: "bg-[var(--color-warning)]" },
          { label: "Maintenance", cls: "bg-[var(--color-destructive)]" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", cls)} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
