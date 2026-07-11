/**
 * SmartSeat AI — Employee TanStack Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeeApi, departmentApi, designationApi } from "@/lib/employees";
import type { CreateEmployeeDto, EmployeeFilters } from "@/types";

// ── Query Keys ─────────────────────────────────────────────────────
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (filters: Partial<EmployeeFilters>) =>
    [...employeeKeys.lists(), filters] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
  unallocated: () => [...employeeKeys.all, "unallocated"] as const,
};

export const departmentKeys = {
  all: ["departments"] as const,
};

export const designationKeys = {
  all: ["designations"] as const,
  byDept: (deptId?: string) => [...designationKeys.all, deptId] as const,
};

// ── Employee List ──────────────────────────────────────────────────
export function useEmployees(filters: Partial<EmployeeFilters> = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => employeeApi.list(filters),
    placeholderData: (prev) => prev, // keep old data while loading
  });
}

// ── Employee Detail ────────────────────────────────────────────────
export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: () => employeeApi.get(id!),
    enabled: !!id,
  });
}

// ── Unallocated ────────────────────────────────────────────────────
export function useUnallocatedEmployees() {
  return useQuery({
    queryKey: employeeKeys.unallocated(),
    queryFn: () => employeeApi.unallocated(),
  });
}

// ── Create ─────────────────────────────────────────────────────────
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeeApi.create(data),
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success(`Employee ${emp.employee_id} created successfully`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to create employee");
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────
export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateEmployeeDto>) =>
      employeeApi.update(id, data),
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
      qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
      toast.success(`${emp.full_name} updated successfully`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to update employee");
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────
export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success("Employee terminated successfully");
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to terminate employee");
    },
  });
}

// ── Bulk Import ────────────────────────────────────────────────────
export function useBulkImportEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeeApi.bulkImport(file),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success(`Import complete: ${result.created} created, ${result.skipped} skipped`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Import failed");
    },
  });
}

// ── Departments ────────────────────────────────────────────────────
export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: () => departmentApi.list(),
    staleTime: 5 * 60 * 1000, // 5 min — rarely changes
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code: string }) => departmentApi.create(data),
    onSuccess: (dept) => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success(`Department "${dept.name}" created`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to create department");
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; code: string }> }) =>
      departmentApi.update(id, data),
    onSuccess: (dept) => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success(`Department "${dept.name}" updated`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to update department");
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department deleted");
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to delete department");
    },
  });
}

// ── Designations ───────────────────────────────────────────────────
export function useDesignations(departmentId?: string) {
  return useQuery({
    queryKey: designationKeys.byDept(departmentId),
    queryFn: () => designationApi.list(departmentId),
    staleTime: 5 * 60 * 1000,
  });
}
