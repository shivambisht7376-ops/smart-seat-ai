/**
 * SmartSeat AI — Seat & Floor API functions
 */
import { apiClient } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { Seat, Floor, Zone, Building, PaginatedResponse } from "@/types";

export interface SeatFilters {
  search?: string;
  zone_id?: number;
  floor_id?: number;
  building_id?: number;
  seat_type?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface CreateSeatDto {
  seat_number: string;
  zone_id: number;
  seat_type?: string;
  status?: string;
}

export interface BulkCreateSeatsDto {
  zone_id: number;
  prefix?: string;
  start_number?: number;
  count: number;
  seat_type?: string;
}

export const seatApi = {
  list: (filters: SeatFilters = {}) =>
    apiClient.get<PaginatedResponse<Seat>>(
      `/seats${buildQueryString(filters as Record<string, string | number | boolean | undefined>)}`
    ),

  get: (id: string) => apiClient.get<Seat>(`/seats/${id}`),

  available: (params: { floor_id?: number; zone_id?: number } = {}) =>
    apiClient.get<{ items: Seat[]; total: number }>(
      `/seats/available${buildQueryString(params as Record<string, string | number | boolean | undefined>)}`
    ),

  utilization: () =>
    apiClient.get<FloorUtilizationData[]>("/seats/utilization"),

  create: (data: CreateSeatDto) => apiClient.post<Seat>("/seats", data),

  bulkCreate: (data: BulkCreateSeatsDto) =>
    apiClient.post<{ created: number; seats: string[] }>("/seats/bulk", data),

  update: (id: string, data: Partial<CreateSeatDto>) =>
    apiClient.put<Seat>(`/seats/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/seats/${id}`),
};

export interface FloorUtilizationData {
  floor_id: number;
  floor_name: string;
  building_name: string;
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  maintenance: number;
  utilization_pct: number;
}

export const buildingApi = {
  list: () => apiClient.get<Building[]>("/buildings"),
  create: (data: { name: string; address?: string; city?: string }) =>
    apiClient.post<Building>("/buildings", data),
};

export const floorApi = {
  list: (building_id?: number) =>
    apiClient.get<Floor[]>(
      `/floors${building_id ? `?building_id=${building_id}` : ""}`
    ),
  create: (data: { building_id: number; floor_number: number; name?: string; total_seats?: number }) =>
    apiClient.post<Floor>("/floors", data),
};

export const zoneApi = {
  list: (floor_id?: number) =>
    apiClient.get<Zone[]>(
      `/zones${floor_id ? `?floor_id=${floor_id}` : ""}`
    ),
  create: (data: { floor_id: number; name: string; capacity?: number }) =>
    apiClient.post<Zone>("/zones", data),
};
