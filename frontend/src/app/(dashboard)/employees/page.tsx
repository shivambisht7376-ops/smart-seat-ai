"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Download,
  Filter,
  FolderOpen,
  Plus,
  RefreshCw,
  Upload,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { EmploymentStatusBadge, BooleanBadge } from "@/components/shared/status-badge";
import { EmployeeFormModal } from "@/components/employees/employee-form-modal";
import { DepartmentManagerModal } from "@/components/employees/department-manager-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useEmployees,
  useDeleteEmployee,
  useBulkImportEmployees,
  useDepartments,
} from "@/hooks/useEmployees";
import { useIsHRAdmin } from "@/store/auth";
import { formatDate, initials, cn } from "@/lib/utils";
import { employeeApi } from "@/lib/employees";
import type { Employee, EmployeeFilters } from "@/types";

// ─── Column definitions ────────────────────────────────────────────────────
function buildColumns(
  onEdit: (emp: Employee) => void,
  onDelete: (emp: Employee) => void,
  canEdit: boolean
): ColumnDef<Employee, unknown>[] {
  return [
    {
      id: "employee_id",
      accessorKey: "employee_id",
      header: "ID",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[var(--color-primary)] font-semibold">
          {row.original.employee_id}
        </span>
      ),
    },
    {
      id: "name",
      header: "Employee",
      enableSorting: false,
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(emp.full_name || `${emp.first_name} ${emp.last_name}`)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-foreground)] truncate">
                {emp.full_name || `${emp.first_name} ${emp.last_name}`}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] truncate">{emp.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "department_name",
      accessorKey: "department_name",
      header: "Department",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as string) || "—"}</span>
      ),
    },
    {
      id: "designation_title",
      accessorKey: "designation_title",
      header: "Designation",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {(getValue() as string) || "—"}
        </span>
      ),
    },
    {
      id: "location",
      accessorKey: "location",
      header: "Location",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as string) || "—"}</span>
      ),
    },
    {
      id: "employment_status",
      accessorKey: "employment_status",
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => (
        <EmploymentStatusBadge status={getValue() as Employee["employment_status"]} />
      ),
    },
    {
      id: "has_active_seat",
      accessorKey: "has_active_seat",
      header: "Seat",
      enableSorting: false,
      cell: ({ getValue }) => (
        <BooleanBadge value={!!getValue()} trueLabel="Allocated" falseLabel="None" />
      ),
    },
    {
      id: "joining_date",
      accessorKey: "joining_date",
      header: "Joined",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: "",
            enableSorting: false,
            cell: ({ row }: { row: { original: Employee } }) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  id={`edit-emp-${row.original.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row.original);
                  }}
                >
                  Edit
                </Button>
                <Button
                  id={`delete-emp-${row.original.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_10%,transparent)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row.original);
                  }}
                >
                  Terminate
                </Button>
              </div>
            ),
          } as ColumnDef<Employee, unknown>,
        ]
      : []),
  ];
}

// ─── Page Component ────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const router = useRouter();
  const isHRAdmin = useIsHRAdmin();

  const [filters, setFilters] = useState<Partial<EmployeeFilters>>({
    page: 1,
    page_size: 20,
    sort_by: "employee_id",
    sort_order: "asc",
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const { data, isLoading, refetch } = useEmployees({
    ...filters,
    search: search || undefined,
  });

  const deleteMutation = useDeleteEmployee();
  const importMutation = useBulkImportEmployees();
  const { data: departments = [] } = useDepartments();

  const handleEdit = useCallback((emp: Employee) => {
    setEditEmployee(emp);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (emp: Employee) => {
      if (confirm(`Terminate ${emp.full_name}? This will remove their seat allocation.`)) {
        await deleteMutation.mutateAsync(emp.id);
      }
    },
    [deleteMutation]
  );

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMutation.mutate(file);
    e.target.value = "";
  };

  const columns = buildColumns(handleEdit, handleDelete, isHRAdmin);

  const stats = [
    {
      icon: <Users className="w-4 h-4" />,
      label: "Total",
      value: data?.total ?? 0,
      color: "text-[var(--color-primary)]",
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      label: "Active",
      value: "—",
      color: "text-[var(--color-success)]",
    },
    {
      icon: <UserX className="w-4 h-4" />,
      label: "Unallocated",
      value: "—",
      color: "text-[var(--color-warning)]",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            {data?.total ? `${data.total.toLocaleString()} total employees` : "Loading…"}
          </p>
        </div>
        {isHRAdmin && (
          <div className="flex items-center gap-2">
            {/* Manage Departments */}
            <Button
              id="manage-departments-btn"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowDeptModal(true)}
            >
              <FolderOpen className="w-4 h-4" />
              Departments
            </Button>

            {/* Bulk Import */}
            <label
              id="bulk-import-btn"
              htmlFor="csv-upload"
              className={cn(
                "flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium cursor-pointer",
                "border border-[var(--color-border)] bg-[var(--color-background)]",
                "hover:bg-[var(--color-accent)] transition-colors"
              )}
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={handleImport}
            />

            {/* Export */}
            <Button
              id="export-csv-btn"
              variant="outline"
              size="sm"
              onClick={() => employeeApi.exportCsv(filters)}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            {/* Add Employee */}
            <Button
              id="add-employee-btn"
              variant="brand"
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditEmployee(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, ID, or email…"
          className="w-72"
          id="employee-search"
        />

        {/* Department filter */}
        <select
          id="dept-filter"
          value={filters.department_id ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              department_id: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            }))
          }
          className={cn(
            "h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          )}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          id="status-filter"
          value={filters.employment_status ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              employment_status: (e.target.value as Employee["employment_status"]) || undefined,
              page: 1,
            }))
          }
          className={cn(
            "h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          )}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>

        {/* Seat filter */}
        <select
          id="seat-filter"
          value={filters.has_seat === undefined ? "" : String(filters.has_seat)}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              has_seat: e.target.value === "" ? undefined : e.target.value === "true",
              page: 1,
            }))
          }
          className={cn(
            "h-9 px-3 rounded-lg text-sm border border-[var(--color-border)]",
            "bg-[var(--color-background)] text-[var(--color-foreground)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          )}
        >
          <option value="">All (Seat)</option>
          <option value="true">Has Seat</option>
          <option value="false">No Seat</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <Button
            id="refresh-employees-btn"
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
          data={(data?.items ?? []) as Employee[]}
          isLoading={isLoading}
          onSortChange={(sort) => {
            if (sort) {
              setFilters((f) => ({ ...f, sort_by: sort.key, sort_order: sort.order }));
            }
          }}
          emptyText="No employees found. Try adjusting your filters."
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

      {/* Create/Edit Modal */}
      <EmployeeFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditEmployee(null);
        }}
        employee={editEmployee}
      />

      {/* Department Manager Modal */}
      <DepartmentManagerModal
        open={showDeptModal}
        onClose={() => setShowDeptModal(false)}
      />
    </div>
  );
}
