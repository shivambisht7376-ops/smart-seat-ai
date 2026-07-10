/**
 * SmartSeat AI — Project API functions
 */
import { apiClient } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { Project, PaginatedResponse } from "@/types";

export interface ProjectFilters {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface CreateProjectDto {
  project_code: string;
  name: string;
  client_name?: string;
  project_manager_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
}

export interface AssignEmployeeDto {
  employee_id: string;
  role_in_project?: string;
  allocation_percentage?: number;
  is_primary?: boolean;
  allocated_date?: string;
}

export const projectApi = {
  list: (filters: ProjectFilters = {}) =>
    apiClient.get<PaginatedResponse<Project>>(
      `/projects${buildQueryString(filters as Record<string, string | number | boolean | undefined>)}`
    ),

  get: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  create: (data: CreateProjectDto) =>
    apiClient.post<Project>("/projects", data),

  update: (id: string, data: Partial<CreateProjectDto>) =>
    apiClient.put<Project>(`/projects/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/projects/${id}`),

  assignEmployee: (projectId: string, data: AssignEmployeeDto) =>
    apiClient.post(`/projects/${projectId}/members`, data),

  removeEmployee: (projectId: string, employeeId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${employeeId}`),

  stats: () => apiClient.get<{ total: number; active: number }>("/projects/stats/summary"),
};
