/**
 * SmartSeat AI — Allocation & New Joiner Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  allocationApi, newJoinerApi,
  type AllocateSeatDto, type AllocationFilters,
  type ReleaseSeatDto, type TransferSeatDto, type NewJoinerDto,
} from "@/lib/allocations";

export const allocKeys = {
  all: ["allocations"] as const,
  lists: () => [...allocKeys.all, "list"] as const,
  list: (f: AllocationFilters) => [...allocKeys.lists(), f] as const,
  byEmployee: (id: string) => [...allocKeys.all, "employee", id] as const,
};

export const njKeys = {
  all: ["new-joiners"] as const,
  list: (status?: string) => [...njKeys.all, status] as const,
};

// ── Allocations ────────────────────────────────────────────────────
export function useAllocations(filters: AllocationFilters = {}) {
  return useQuery({
    queryKey: allocKeys.list(filters),
    queryFn: () => allocationApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useEmployeeAllocation(employeeId: string | undefined) {
  return useQuery({
    queryKey: allocKeys.byEmployee(employeeId!),
    queryFn: () => allocationApi.getByEmployee(employeeId!),
    enabled: !!employeeId,
  });
}

export function useAllocateSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AllocateSeatDto) => allocationApi.allocate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allocKeys.lists() });
      qc.invalidateQueries({ queryKey: ["seats"] });
      toast.success("Seat allocated successfully");
    },
    onError: (err: { detail?: string }) =>
      toast.error(err?.detail ?? "Allocation failed"),
  });
}

export function useReleaseSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data?: ReleaseSeatDto }) =>
      allocationApi.release(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allocKeys.lists() });
      qc.invalidateQueries({ queryKey: ["seats"] });
      toast.success("Seat released");
    },
    onError: (err: { detail?: string }) =>
      toast.error(err?.detail ?? "Release failed"),
  });
}

export function useTransferSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: TransferSeatDto }) =>
      allocationApi.transfer(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: allocKeys.lists() });
      qc.invalidateQueries({ queryKey: ["seats"] });
      toast.success("Seat transferred");
    },
    onError: (err: { detail?: string }) =>
      toast.error(err?.detail ?? "Transfer failed"),
  });
}

// ── New Joiners ────────────────────────────────────────────────────
export function useNewJoiners(status?: string) {
  return useQuery({
    queryKey: njKeys.list(status),
    queryFn: () => newJoinerApi.list(status),
  });
}

export function useCreateNewJoiner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewJoinerDto) => newJoinerApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: njKeys.all });
      toast.success("New joiner added to queue");
    },
    onError: (err: { detail?: string }) =>
      toast.error(err?.detail ?? "Failed to create new joiner"),
  });
}

export function useAllocateNewJoiner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ njId, seatId }: { njId: string; seatId: string }) =>
      newJoinerApi.allocate(njId, seatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: njKeys.all });
      qc.invalidateQueries({ queryKey: allocKeys.lists() });
      qc.invalidateQueries({ queryKey: ["seats"] });
      toast.success("Seat allocated to new joiner");
    },
    onError: (err: { detail?: string }) =>
      toast.error(err?.detail ?? "Allocation failed"),
  });
}
