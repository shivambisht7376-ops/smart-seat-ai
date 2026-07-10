/**
 * SmartSeat AI — Allocation API functions
 */
import { apiClient } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { SeatAllocation, PaginatedResponse } from "@/types";

export interface AllocateSeatDto {
  employee_id: string;
  seat_id: string;
  notes?: string;
  allocated_date?: string;
}

export interface ReleaseSeatDto {
  notes?: string;
}

export interface TransferSeatDto {
  new_seat_id: string;
  notes?: string;
}

export interface AllocationFilters {
  is_active?: boolean;
  floor_id?: number;
  zone_id?: number;
  page?: number;
  page_size?: number;
}

export const allocationApi = {
  list: (filters: AllocationFilters = {}) =>
    apiClient.get<PaginatedResponse<SeatAllocation>>(
      `/allocations${buildQueryString(filters as Record<string, string | number | boolean | undefined>)}`
    ),

  allocate: (data: AllocateSeatDto) =>
    apiClient.post<SeatAllocation>("/allocations", data),

  getByEmployee: (employeeId: string) =>
    apiClient.get<SeatAllocation | null>(`/allocations/employee/${employeeId}`),

  release: (employeeId: string, data: ReleaseSeatDto = {}) =>
    apiClient.post<SeatAllocation>(`/allocations/release/${employeeId}`, data),

  transfer: (employeeId: string, data: TransferSeatDto) =>
    apiClient.post<SeatAllocation>(`/allocations/transfer/${employeeId}`, data),
};

export interface NewJoinerDto {
  employee_id: string;
  expected_joining_date?: string;
  preferred_floor_id?: number;
  preferred_zone?: string;
  notes?: string;
}

export const newJoinerApi = {
  list: (status?: string) =>
    apiClient.get<{ items: object[]; total: number }>(
      `/new-joiners${status ? `?status=${status}` : ""}`
    ),

  create: (data: NewJoinerDto) =>
    apiClient.post("/new-joiners", data),

  allocate: (njId: string, seatId: string) =>
    apiClient.post(`/new-joiners/${njId}/allocate?seat_id=${seatId}`, {}),
};
