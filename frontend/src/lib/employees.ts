/**
 * SmartSeat AI — Employee API functions
 */
import { apiClient } from "@/lib/api";
import type {
  Employee,
  PaginatedResponse,
  EmployeeFilters,
  CreateEmployeeDto,
  Department,
  Designation,
} from "@/types";
import { buildQueryString } from "@/lib/utils";

export const employeeApi = {
  // ── List with filters ────────────────────────────────────────────
  list: (filters: Partial<EmployeeFilters> = {}) =>
    apiClient.get<PaginatedResponse<Employee>>(
      `/employees${buildQueryString(filters as Record<string, string | number | boolean | undefined>)}`
    ),

  // ── Get single ───────────────────────────────────────────────────
  get: (id: string) => apiClient.get<Employee>(`/employees/${id}`),

  // ── Create ───────────────────────────────────────────────────────
  create: (data: CreateEmployeeDto) =>
    apiClient.post<Employee>("/employees", data),

  // ── Update ───────────────────────────────────────────────────────
  update: (id: string, data: Partial<CreateEmployeeDto>) =>
    apiClient.patch<Employee>(`/employees/${id}`, data),

  // ── Delete (soft) ────────────────────────────────────────────────
  delete: (id: string) => apiClient.delete<void>(`/employees/${id}`),

  // ── Unallocated ──────────────────────────────────────────────────
  unallocated: () =>
    apiClient.get<{ items: Employee[]; total: number }>("/employees/unallocated"),

  // ── Bulk CSV import ──────────────────────────────────────────────
  bulkImport: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<{
      total: number;
      created: number;
      skipped: number;
      errors: Array<{ row: number; error: string }>;
    }>("/employees/bulk-import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ── CSV export ───────────────────────────────────────────────────
  exportCsv: (filters: Partial<EmployeeFilters> = {}) => {
    const qs = buildQueryString(
      filters as Record<string, string | number | boolean | undefined>
    );
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/employees/export${qs}`
    );
  },
};

// ── Departments ────────────────────────────────────────────────────
export const departmentApi = {
  list: () => apiClient.get<Department[]>("/departments"),
  create: (data: { name: string; code: string }) =>
    apiClient.post<Department>("/departments", data),
  update: (id: string, data: Partial<{ name: string; code: string }>) =>
    apiClient.patch<Department>(`/departments/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/departments/${id}`),
};

// ── Designations ───────────────────────────────────────────────────
export const designationApi = {
  list: (department_id?: string) =>
    apiClient.get<Designation[]>(
      `/designations${department_id ? `?department_id=${department_id}` : ""}`
    ),
  create: (data: { title: string; level?: number; department_id?: string }) =>
    apiClient.post<Designation>("/designations", data),
};
