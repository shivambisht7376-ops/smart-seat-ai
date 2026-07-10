import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// ─── Employee ─────────────────────────────────────────────────────────────────
export const createEmployeeSchema = z.object({
  employee_id: z.string().optional(),
  seat_id: z.string().optional(),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  department_id: z.string().optional(),
  designation_id: z.string().optional(),
  manager_id: z.string().uuid().optional().or(z.literal("")),
  location: z.string().optional(),
  joining_date: z.string().min(1, "Joining date is required"),
  employment_status: z
    .enum(["active", "inactive", "on_leave", "terminated"])
    .default("active"),
  is_new_joiner: z.boolean().default(false),
});

// ─── Project ──────────────────────────────────────────────────────────────────
export const createProjectSchema = z.object({
  project_code: z.string().min(2, "Project code is required").max(20),
  name: z.string().min(2, "Project name is required").max(200),
  client_name: z.string().optional(),
  project_manager_id: z.string().uuid().optional().or(z.literal("")),
  status: z
    .enum(["active", "completed", "on_hold", "cancelled", "archived"])
    .default("active"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().positive().optional(),
  description: z.string().optional(),
});

// ─── Seat Allocation ──────────────────────────────────────────────────────────
export const createAllocationSchema = z.object({
  employee_id: z.string().uuid("Select a valid employee"),
  seat_id: z.string().uuid("Select a valid seat"),
  notes: z.string().optional(),
  allocated_date: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateEmployeeData = z.infer<typeof createEmployeeSchema>;
export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type CreateAllocationData = z.infer<typeof createAllocationSchema>;
