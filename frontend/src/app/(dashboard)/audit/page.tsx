"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Activity, RefreshCw, Shield } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { useAuditLogs, useAuditActions, type AuditLog, type AuditFilters } from "@/lib/audit";
import { formatDateTime, cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  CREATE:   "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
  UPDATE:   "bg-[color-mix(in_srgb,#06b6d4_15%,transparent)] text-[#06b6d4]",
  DELETE:   "bg-[color-mix(in_srgb,var(--color-destructive)_15%,transparent)] text-[var(--color-destructive)]",
  ALLOCATE: "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]",
  RELEASE:  "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]",
  TRANSFER: "bg-[color-mix(in_srgb,#8b5cf6_15%,transparent)] text-[#8b5cf6]",
  LOGIN:    "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]",
  LOGOUT:   "bg-[color-mix(in_srgb,var(--color-muted-foreground)_15%,transparent)] text-[var(--color-muted-foreground)]",
};

const columns: ColumnDef<AuditLog, unknown>[] = [
  {
    id: "timestamp", accessorKey: "created_at", header: "Timestamp",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
        {formatDateTime(new Date(getValue() as string))}
      </span>
    ),
  },
  {
    id: "action", accessorKey: "action", header: "Action",
    cell: ({ getValue }) => {
      const action = getValue() as string;
      return (
        <span className={cn("inline-block px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide",
          ACTION_COLORS[action] ?? "bg-[var(--color-accent)] text-[var(--color-foreground)]")}>
          {action}
        </span>
      );
    },
  },
  {
    id: "entity", header: "Entity",
    cell: ({ row }) => (
      <div className="text-sm">
        <p className="font-medium capitalize text-[var(--color-foreground)]">{row.original.entity_type}</p>
        {row.original.entity_id && (
          <p className="text-xs font-mono text-[var(--color-muted-foreground)] truncate max-w-[120px]">
            {row.original.entity_id.length > 24
              ? `${row.original.entity_id.slice(0, 8)}…`
              : row.original.entity_id}
          </p>
        )}
      </div>
    ),
  },
  {
    id: "user", header: "Performed By",
    cell: ({ row }) => (
      <span className="text-sm text-[var(--color-foreground)]">
        {row.original.user_email ?? <span className="text-[var(--color-muted-foreground)]">System</span>}
      </span>
    ),
  },
  {
    id: "changes", header: "Changes",
    cell: ({ row }) => {
      const log = row.original;
      if (!log.new_values && !log.old_values) return <span className="text-[var(--color-muted-foreground)] text-xs">—</span>;
      const keys = Object.keys(log.new_values ?? log.old_values ?? {}).slice(0, 3);
      return (
        <div className="flex flex-wrap gap-1">
          {keys.map((k) => (
            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)] text-[var(--color-muted-foreground)] font-mono">
              {k}
            </span>
          ))}
          {keys.length < Object.keys(log.new_values ?? log.old_values ?? {}).length && (
            <span className="text-[10px] text-[var(--color-muted-foreground)]">+more</span>
          )}
        </div>
      );
    },
  },
];

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, page_size: 30 });
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useAuditLogs({ ...filters, search: search || undefined });
  const { data: meta } = useAuditActions();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">
              {data?.total != null ? `${data.total.toLocaleString()} audit events` : "Loading…"}
            </p>
          </div>
        </div>
      </div>

      {/* Action summary chips */}
      <div className="flex flex-wrap gap-2">
        {(meta?.actions ?? []).map((action) => (
          <button
            key={action}
            id={`audit-action-${action.toLowerCase()}`}
            onClick={() => setFilters((f) => ({
              ...f,
              action: f.action === action ? undefined : action,
              page: 1,
            }))}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border transition-all",
              filters.action === action
                ? (ACTION_COLORS[action] ?? "") + " border-current"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
            )}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Filters toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar id="audit-search" value={search} onChange={setSearch}
          placeholder="Search entity ID, action…" className="w-64" />

        <select id="audit-entity-filter"
          value={filters.entity_type ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, entity_type: e.target.value || undefined, page: 1 }))}
          className={cn("h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]")}>
          <option value="">All Entities</option>
          {(meta?.entity_types ?? []).map((t) => (
            <option key={t} value={t} className="capitalize">{t}</option>
          ))}
        </select>

        {(filters.action || filters.entity_type || search) && (
          <Button id="audit-clear" variant="ghost" size="sm"
            onClick={() => { setFilters({ page: 1, page_size: 30 }); setSearch(""); }}>
            Clear filters
          </Button>
        )}

        <div className="ml-auto">
          <Button id="refresh-audit" variant="ghost" size="icon" className="h-9 w-9" onClick={() => refetch()}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <DataTable columns={columns} data={data?.items ?? []}
          isLoading={isLoading} emptyText="No audit events match your filters." />
        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={data.total_pages}
            hasNext={data.has_next} hasPrev={data.has_prev}
            total={data.total} pageSize={data.page_size}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            className="border-t border-[var(--color-border)]" />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {Object.entries(ACTION_COLORS).map(([action, cls]) => (
          <span key={action} className="flex items-center gap-1.5 text-xs">
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", cls)}>{action}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
