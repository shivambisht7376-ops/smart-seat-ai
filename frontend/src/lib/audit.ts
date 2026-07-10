/**
 * SmartSeat AI — Audit Log API + Hooks
 */
import { apiClient } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types";

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AuditFilters {
  action?: string;
  entity_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const auditApi = {
  list: (filters: AuditFilters = {}) =>
    apiClient.get<PaginatedResponse<AuditLog>>(
      `/audit${buildQueryString(filters as Record<string, string | number | boolean | undefined>)}`
    ),
  actions: () =>
    apiClient.get<{ actions: string[]; entity_types: string[] }>("/audit/actions"),
};

export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (f: AuditFilters) => [...auditKeys.lists(), f] as const,
};

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAuditActions() {
  return useQuery({
    queryKey: [...auditKeys.all, "actions"],
    queryFn: () => auditApi.actions(),
    staleTime: Infinity,
  });
}
