/**
 * SmartSeat AI — Seat TanStack Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  seatApi, buildingApi, floorApi, zoneApi,
  type SeatFilters, type CreateSeatDto, type BulkCreateSeatsDto,
} from "@/lib/seats";

export const seatKeys = {
  all: ["seats"] as const,
  lists: () => [...seatKeys.all, "list"] as const,
  list: (f: SeatFilters) => [...seatKeys.lists(), f] as const,
  detail: (id: string) => [...seatKeys.all, "detail", id] as const,
  available: (params: object) => [...seatKeys.all, "available", params] as const,
  utilization: () => [...seatKeys.all, "utilization"] as const,
};

export const buildingKeys = { all: ["buildings"] as const };
export const floorKeys = {
  all: ["floors"] as const,
  byBuilding: (id?: number) => [...floorKeys.all, id] as const,
};
export const zoneKeys = {
  all: ["zones"] as const,
  byFloor: (id?: number) => [...zoneKeys.all, id] as const,
};

// ── Seats ──────────────────────────────────────────────────────────
export function useSeats(filters: SeatFilters = {}) {
  return useQuery({
    queryKey: seatKeys.list(filters),
    queryFn: () => seatApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useSeat(id: string | undefined) {
  return useQuery({
    queryKey: seatKeys.detail(id!),
    queryFn: () => seatApi.get(id!),
    enabled: !!id,
  });
}

export function useAvailableSeats(params: { floor_id?: number; zone_id?: number } = {}) {
  return useQuery({
    queryKey: seatKeys.available(params),
    queryFn: () => seatApi.available(params),
  });
}

export function useSeatUtilization() {
  return useQuery({
    queryKey: seatKeys.utilization(),
    queryFn: () => seatApi.utilization(),
    staleTime: 60 * 1000,
  });
}

export function useCreateSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSeatDto) => seatApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seatKeys.lists() });
      toast.success("Seat created");
    },
    onError: (err: { detail?: string }) => toast.error(err?.detail ?? "Failed to create seat"),
  });
}

export function useBulkCreateSeats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateSeatsDto) => seatApi.bulkCreate(data),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: seatKeys.lists() });
      toast.success(`${r.created} seats created`);
    },
    onError: (err: { detail?: string }) => toast.error(err?.detail ?? "Bulk create failed"),
  });
}

export function useUpdateSeat(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateSeatDto>) => seatApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seatKeys.lists() });
      qc.invalidateQueries({ queryKey: seatKeys.detail(id) });
      toast.success("Seat updated");
    },
    onError: (err: { detail?: string }) => toast.error(err?.detail ?? "Update failed"),
  });
}

export function useDeleteSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seatApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seatKeys.lists() });
      toast.success("Seat deleted");
    },
    onError: (err: { detail?: string }) => toast.error(err?.detail ?? "Delete failed"),
  });
}

// ── Buildings ──────────────────────────────────────────────────────
export function useBuildings() {
  return useQuery({
    queryKey: buildingKeys.all,
    queryFn: () => buildingApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Floors ─────────────────────────────────────────────────────────
export function useFloors(buildingId?: number) {
  return useQuery({
    queryKey: floorKeys.byBuilding(buildingId),
    queryFn: () => floorApi.list(buildingId),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Zones ──────────────────────────────────────────────────────────
export function useZones(floorId?: number) {
  return useQuery({
    queryKey: zoneKeys.byFloor(floorId),
    queryFn: () => zoneApi.list(floorId),
    staleTime: 5 * 60 * 1000,
  });
}
