/**
 * SmartSeat AI — Core TypeScript Types
 * All domain entities matching the backend Pydantic schemas
 */

// ─── Roles & Auth ────────────────────────────────────────────────────────────

export type RoleName = "super_admin" | "hr_admin" | "project_manager" | "employee";

export interface Role {
  id: number;
  name: RoleName;
  permissions: Record<string, string[]>;
}

export interface User {
  id: string;
  email: string;
  role_id: number;
  role?: Role;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CurrentUser extends User {
  employee?: Employee;
}

// ─── Department & Designation ────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  code: string;
  manager_id?: string;
  created_at: string;
}

export interface Designation {
  id: number;
  title: string;
  level?: number;
  department_id?: number;
  department?: Department;
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export type EmploymentStatus = "active" | "inactive" | "on_leave" | "terminated";

export interface Employee {
  id: string;
  employee_id: string; // EMP-00001
  user_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  department?: Department;
  designation_id?: string;
  designation?: Designation;
  manager_id?: string;
  manager?: Employee;
  location?: string;
  joining_date: string;
  employment_status: EmploymentStatus;
  is_new_joiner: boolean;
  created_at: string;
  updated_at: string;
  // Computed / joined
  active_seat?: SeatAllocation;
  active_project?: EmployeeProject;
}

export interface CreateEmployeeDto {
  employee_id?: string;
  seat_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  designation_id?: string;
  manager_id?: string;
  location?: string;
  joining_date: string;
  employment_status?: EmploymentStatus;
  is_new_joiner?: boolean;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "completed" | "on_hold" | "cancelled" | "archived";

export interface Project {
  id: string;
  project_code: string;
  name: string;
  client_name?: string;
  project_manager_id?: string;
  project_manager?: Employee;
  project_manager_name?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  resource_count: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // Computed
  active_resource_count?: number;
  employee_assignments?: EmployeeProject[];
  members?: EmployeeProject[];
}

export interface EmployeeProject {
  id: string;
  employee_id: string;
  project_id: string;
  employee?: Employee;
  project?: Project;
  // Denormalised (returned from API)
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  designation_title?: string;
  role_in_project?: string;
  allocation_percentage: number;
  is_primary: boolean;
  allocated_date: string;
  deallocated_date?: string;
  is_active: boolean;
}

// ─── Floor & Seat ────────────────────────────────────────────────────────────

export interface Building {
  id: number;
  name: string;
  address?: string;
  city?: string;
  total_floors?: number;
  floors?: Floor[];
}

export interface Floor {
  id: number;
  building_id: number;
  building?: Building;
  floor_number: number;
  name?: string;
  total_seats: number;
  zones?: Zone[];
}

export interface Zone {
  id: number;
  floor_id: number;
  floor?: Floor;
  name: string;
  capacity?: number;
  seats?: Seat[];
}

export type SeatType = "standard" | "standing" | "cabin" | "hot_desk";
export type SeatStatus = "available" | "occupied" | "reserved" | "maintenance";

export interface Seat {
  id: string;
  seat_number: string;
  zone_id: number;
  zone?: Zone;
  seat_type: SeatType;
  status: SeatStatus;
  created_at: string;
  updated_at: string;
  // Denormalised from SeatListItem
  zone_name?: string;
  floor_id?: number;
  floor_name?: string;
  building_name?: string;
  // Joined
  current_employee?: Employee;
  current_employee_id?: string;
  current_employee_name?: string;
  current_employee_code?: string;
}

// ─── Seat Allocation ─────────────────────────────────────────────────────────

export interface SeatAllocation {
  id: string;
  employee_id: string;
  seat_id: string;
  allocated_by?: string;
  allocated_date: string;
  released_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: Employee;
  seat?: Seat;
}

export interface CreateAllocationDto {
  employee_id: string;
  seat_id: string;
  notes?: string;
  allocated_date?: string;
}

export type NewJoinerStatus = "pending" | "allocated" | "cancelled";

export interface NewJoiner {
  id: string;
  employee_id: string;
  employee?: Employee;
  expected_joining_date?: string;
  preferred_floor_id?: number;
  preferred_floor?: Floor;
  preferred_zone?: string;
  seat_id?: string;
  allocated_seat?: Seat;
  status: NewJoinerStatus;
  notes?: string;
  created_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  allocated_employees: number;
  unallocated_employees: number;
  total_seats: number;
  occupied_seats: number;
  available_seats: number;
  total_projects: number;
  active_projects: number;
  new_joiners_pending: number;
  seat_utilization_pct: number;
  allocation_rate_pct: number;
}

export interface SeatUtilizationByFloor {
  floor_name: string;
  building_name: string;
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  maintenance: number;
  utilization_pct: number;
}

export interface ProjectUtilization {
  project_name: string;
  project_code: string;
  status: ProjectStatus;
  resource_count: number;
  active_employees: number;
}

export interface DepartmentDistribution {
  department: string;
  count: number;
  percentage: number;
}

export interface OccupancyTrend {
  date: string;
  occupied: number;
  available: number;
  utilization_pct: number;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ALLOCATE"
  | "RELEASE"
  | "TRANSFER"
  | "LOGIN"
  | "LOGOUT";

export type AuditEntityType =
  | "employee"
  | "project"
  | "seat"
  | "allocation"
  | "user"
  | "floor"
  | "zone";

export interface AuditLog {
  id: string;
  user_id?: string;
  user?: User;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ─── AI Assistant ────────────────────────────────────────────────────────────

export interface AIQueryRequest {
  query: string;
}

export interface AIQueryResponse {
  id: string;
  natural_language_query: string;
  generated_sql?: string;
  query_result?: AIQueryResult;
  execution_time_ms?: number;
  is_safe: boolean;
  provider: "mock" | "openai";
  created_at: string;
}

export interface AIQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  total_count: number;
  summary?: string;
}

// ─── API Pagination ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface EmployeeFilters extends PaginationParams {
  department_id?: number;
  designation_id?: number;
  employment_status?: EmploymentStatus;
  is_new_joiner?: boolean;
  has_seat?: boolean;
  has_project?: boolean;
  joining_date_from?: string;
  joining_date_to?: string;
}

export interface ProjectFilters extends PaginationParams {
  status?: string;
  project_manager_id?: string;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[];
  status_code?: number;
}
