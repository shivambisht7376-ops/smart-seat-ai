/**
 * SmartSeat AI — Analytics & AI Query Hooks
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyticsApi, aiApi } from "@/lib/analytics";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsApi.dashboard(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useDepartmentDistribution() {
  return useQuery({
    queryKey: ["analytics", "departments"],
    queryFn: () => analyticsApi.departments(),
    staleTime: 60 * 1000,
  });
}

export function useSeatUtilizationAnalytics() {
  return useQuery({
    queryKey: ["analytics", "seat-utilization"],
    queryFn: () => analyticsApi.seatUtilization(),
    staleTime: 60 * 1000,
  });
}

export function useEmploymentStatusBreakdown() {
  return useQuery({
    queryKey: ["analytics", "employment-status"],
    queryFn: () => analyticsApi.employmentStatus(),
    staleTime: 60 * 1000,
  });
}

export function useProjectUtilizationAnalytics() {
  return useQuery({
    queryKey: ["analytics", "projects"],
    queryFn: () => analyticsApi.projectUtilization(),
    staleTime: 60 * 1000,
  });
}

export function useAISuggestions() {
  return useQuery({
    queryKey: ["ai", "suggestions"],
    queryFn: () => aiApi.suggestions(),
    staleTime: Infinity,
  });
}

export function useAIQuery() {
  return useMutation({
    mutationFn: (question: string) => aiApi.query(question),
    onError: (err: { detail?: string }) =>
      toast.error(err?.detail ?? "AI query failed"),
  });
}
