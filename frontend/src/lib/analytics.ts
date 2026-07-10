/**
 * SmartSeat AI — Analytics API + AI Query API
 */
import { apiClient } from "@/lib/api";
import type { DashboardStats } from "@/types";

export const analyticsApi = {
  dashboard: () => apiClient.get<DashboardStats>("/analytics/dashboard"),

  departments: () =>
    apiClient.get<{ department: string; count: number; percentage: number }[]>(
      "/analytics/departments"
    ),

  seatUtilization: () =>
    apiClient.get<{
      floor_id: number; floor_name: string; building_name: string;
      total: number; occupied: number; available: number;
      reserved: number; maintenance: number; utilization_pct: number;
    }[]>("/analytics/seats/utilization"),

  employmentStatus: () =>
    apiClient.get<{ status: string; count: number }[]>(
      "/analytics/employment-status"
    ),

  projectUtilization: () =>
    apiClient.get<{
      project_name: string; project_code: string;
      status: string; active_employees: number;
    }[]>("/analytics/projects"),
};

export const aiApi = {
  query: (question: string) =>
    apiClient.post<{
      id: string;
      natural_language_query: string;
      generated_sql: string;
      query_result: {
        columns: string[];
        rows: Record<string, unknown>[];
        total_count: number;
        summary: string;
      } | null;
      execution_time_ms: number;
      is_safe: boolean;
      provider: "mock" | "openai";
      created_at: string;
      error?: string;
    }>("/ai", { query: question }),

  suggestions: () =>
    apiClient.get<{ suggestions: string[] }>("/ai/suggestions"),
};
