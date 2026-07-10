"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, RefreshCw, Briefcase } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { Button } from "@/components/ui/button";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { useIsProjectManager } from "@/store/auth";
import { formatDate, formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { Project, ProjectFilters } from "@/types";

function buildColumns(
  onEdit: (p: Project) => void,
  onDelete: (p: Project) => void,
  canEdit: boolean,
  router: ReturnType<typeof useRouter>
): ColumnDef<Project, unknown>[] {
  return [
    {
      id: "project_code",
      accessorKey: "project_code",
      header: "Code",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/projects/${row.original.id}`)}
          className="font-mono text-xs font-semibold text-[var(--color-primary)] hover:underline"
        >
          {row.original.project_code}
        </button>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Project Name",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <button
            onClick={() => router.push(`/projects/${row.original.id}`)}
            className="font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors text-left"
          >
            {row.original.name}
          </button>
          {row.original.client_name && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {row.original.client_name}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "project_manager_name",
      accessorKey: "project_manager_name",
      header: "Manager",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as string) || "—"}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => (
        <ProjectStatusBadge status={getValue() as Project["status"]} />
      ),
    },
    {
      id: "active_resource_count",
      accessorKey: "active_resource_count",
      header: "Members",
      enableSorting: false,
      cell: ({ getValue }) => {
        const count = (getValue() as number) ?? 0;
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            count > 0 ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"
          )}>
            <Briefcase className="w-3.5 h-3.5" />
            {count}
          </span>
        );
      },
    },
    {
      id: "budget",
      accessorKey: "budget",
      header: "Budget",
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <span className="text-sm text-[var(--color-muted-foreground)]">
            {v ? formatCurrency(v) : "—"}
          </span>
        );
      },
    },
    {
      id: "start_date",
      accessorKey: "start_date",
      header: "Start",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {getValue() ? formatDate(getValue() as string) : "—"}
        </span>
      ),
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: Project } }) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  id={`edit-proj-${row.original.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
                >
                  Edit
                </Button>
                <Button
                  id={`delete-proj-${row.original.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_10%,transparent)]"
                  onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}
                >
                  Archive
                </Button>
              </div>
            ),
          } as ColumnDef<Project, unknown>,
        ]
      : []),
  ];
}

export default function ProjectsPage() {
  const router = useRouter();
  const isPM = useIsProjectManager();

  const [filters, setFilters] = useState<Partial<ProjectFilters>>({
    page: 1, page_size: 20, sort_by: "project_code", sort_order: "asc",
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const { data, isLoading, refetch } = useProjects({
    ...filters,
    search: search || undefined,
  } as import("@/lib/projects").ProjectFilters);

  const deleteMutation = useDeleteProject();

  const handleEdit = useCallback((p: Project) => {
    setEditProject(p);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (p: Project) => {
      if (confirm(`Archive project "${p.name}"? It will be marked as archived.`)) {
        await deleteMutation.mutateAsync(p.id);
      }
    },
    [deleteMutation]
  );

  const columns = buildColumns(handleEdit, handleDelete, isPM, router);

  // KPI counts from the data
  const statuses = ["active", "on_hold", "completed"] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {data?.total != null ? `${formatNumber(data.total)} total projects` : "Loading…"}
          </p>
        </div>
        {isPM && (
          <Button
            id="add-project-btn"
            variant="brand"
            size="sm"
            className="gap-2"
            onClick={() => { setEditProject(null); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, code, or client…"
          className="w-72"
          id="project-search"
        />

        <select
          id="status-filter"
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))
          }
          className={cn(
            "h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          )}
        >
          <option value="">All Statuses</option>
          {["active", "on_hold", "completed", "cancelled", "archived"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>

        <div className="ml-auto">
          <Button
            id="refresh-projects-btn"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <DataTable
          columns={columns}
          data={(data?.items ?? []) as Project[]}
          isLoading={isLoading}
          onSortChange={(sort) => {
            if (sort) setFilters((f) => ({ ...f, sort_by: sort.key, sort_order: sort.order }));
          }}
          emptyText="No projects found. Create your first project."
        />
        {data && data.total > 0 && (
            <Pagination
              page={data.page}
              totalPages={data.pages}
              hasNext={data.page < data.pages}
              hasPrev={data.page > 1}
              total={data.total}
            pageSize={data.page_size}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            className="border-t border-[var(--color-border)]"
          />
        )}
      </div>

      <ProjectFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditProject(null); }}
        project={editProject}
      />
    </div>
  );
}
