/**
 * SmartSeat AI — Project TanStack Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectApi, type ProjectFilters, type CreateProjectDto, type AssignEmployeeDto } from "@/lib/projects";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  stats: () => [...projectKeys.all, "stats"] as const,
};

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: () => projectApi.get(id!),
    enabled: !!id,
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: () => projectApi.stats(),
    staleTime: 30 * 1000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectApi.create(data),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success(`Project "${p.name}" created`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to create project");
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateProjectDto>) => projectApi.update(id, data),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
      toast.success(`"${p.name}" updated`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to update project");
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project archived");
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Failed to archive project");
    },
  });
}

export function useAssignEmployee(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignEmployeeDto) =>
      projectApi.assignEmployee(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success("Employee assigned to project");
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Assignment failed");
    },
  });
}

export function useRemoveEmployee(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) =>
      projectApi.removeEmployee(projectId, employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success("Employee removed from project");
    },
    onError: (err: { detail?: string }) => {
      toast.error(err?.detail ?? "Removal failed");
    },
  });
}
