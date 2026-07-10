"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployeeSchema, type CreateEmployeeData } from "@/lib/validations";
import { useCreateEmployee, useUpdateEmployee, useDepartments, useDesignations } from "@/hooks/useEmployees";
import { useSeats } from "@/hooks/useSeats";
import { cn, formatDate } from "@/lib/utils";
import type { Employee } from "@/types";

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null; // null = create mode, Employee = edit mode
}

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

export function EmployeeFormModal({
  open,
  onClose,
  employee,
}: EmployeeFormModalProps) {
  const isEdit = !!employee;
  const { data: departments = [] } = useDepartments();
  const { data: availableSeats } = useSeats({ status: "available" });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateEmployeeData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createEmployeeSchema) as any,
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      joining_date: new Date().toISOString().slice(0, 10),
      employment_status: "active",
      is_new_joiner: false,
    },
  });

  const selectedDeptId = watch("department_id");
  const { data: designations = [] } = useDesignations(selectedDeptId);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employee?.id ?? "");

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone ?? "",
        department_id: employee.department_id ?? undefined,
        designation_id: employee.designation_id ?? undefined,
        employee_id: employee.employee_id ?? "",
        location: employee.location ?? "",
        joining_date: employee.joining_date,
        employment_status: employee.employment_status,
        is_new_joiner: employee.is_new_joiner,
        seat_id: employee.active_seat?.seat_id ?? undefined,
      });
    } else {
      reset({
        first_name: "",
        last_name: "",
        email: "",
        joining_date: new Date().toISOString().slice(0, 10),
        employment_status: "active",
        is_new_joiner: false,
      });
    }
  }, [employee, reset, open]);

  const onSubmit = async (data: CreateEmployeeData) => {
    if (isEdit) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const fieldClass = (hasError: boolean) =>
    cn(hasError && "border-[var(--color-destructive)] focus-visible:ring-[var(--color-destructive)]");

  const titleName = isEdit ? (employee?.full_name || `${employee?.first_name} ${employee?.last_name}`) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${titleName}` : "Add New Employee"}
      description={isEdit ? employee?.employee_id : "Fill in the details to create a new employee record."}
      size="lg"
      id="employee-form-modal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* ID and Seat row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-employee-id">Employee ID (Optional)</Label>
            <Input
              id="emp-employee-id"
              placeholder="EMP-12345"
              {...register("employee_id")}
              className={fieldClass(!!errors.employee_id)}
            />
            {errors.employee_id && (
              <p className="text-xs text-[var(--color-destructive)]">{errors.employee_id.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-seat">Assign Seat (Optional)</Label>
            <select
              id="emp-seat"
              {...register("seat_id")}
              className={cn(
                "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
                "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              )}
            >
              <option value="">— No Seat —</option>
              {availableSeats?.items?.map((s) => (
                <option key={s.id} value={s.id}>{s.seat_number}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-first-name">First Name *</Label>
            <Input
              id="emp-first-name"
              placeholder="Jane"
              {...register("first_name")}
              className={fieldClass(!!errors.first_name)}
            />
            {errors.first_name && (
              <p className="text-xs text-[var(--color-destructive)]">{errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-last-name">Last Name *</Label>
            <Input
              id="emp-last-name"
              placeholder="Doe"
              {...register("last_name")}
              className={fieldClass(!!errors.last_name)}
            />
            {errors.last_name && (
              <p className="text-xs text-[var(--color-destructive)]">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-email">Email *</Label>
            <Input
              id="emp-email"
              type="email"
              placeholder="jane@company.com"
              {...register("email")}
              className={fieldClass(!!errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-[var(--color-destructive)]">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-phone">Phone</Label>
            <Input
              id="emp-phone"
              type="tel"
              placeholder="+91 9876543210"
              {...register("phone")}
            />
          </div>
        </div>

        {/* Department + Designation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-department">Department</Label>
            <select
              id="emp-department"
              {...register("department_id")}
              className={cn(
                "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
                "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              )}
            >
              <option value="">— Select Department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-designation">Designation</Label>
            <select
              id="emp-designation"
              {...register("designation_id")}
              className={cn(
                "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
                "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              )}
            >
              <option value="">— Select Designation —</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location + Joining Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-location">Location</Label>
            <Input
              id="emp-location"
              placeholder="Bengaluru"
              {...register("location")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-joining-date">Joining Date *</Label>
            <Input
              id="emp-joining-date"
              type="date"
              {...register("joining_date")}
              className={fieldClass(!!errors.joining_date)}
            />
            {errors.joining_date && (
              <p className="text-xs text-[var(--color-destructive)]">{errors.joining_date.message}</p>
            )}
          </div>
        </div>

        {/* Status + New Joiner */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-status">Employment Status</Label>
            <select
              id="emp-status"
              {...register("employment_status")}
              className={cn(
                "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
                "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              )}
            >
              {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>New Joiner</Label>
            <label
              htmlFor="emp-new-joiner"
              className={cn(
                "flex h-10 items-center gap-3 px-3 rounded-lg cursor-pointer",
                "border border-[var(--color-border)] bg-[var(--color-background)]",
                "hover:bg-[var(--color-accent)] transition-colors"
              )}
            >
              <input
                id="emp-new-joiner"
                type="checkbox"
                {...register("is_new_joiner")}
                className="w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-foreground)]">Mark as new joiner</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
          <Button
            id="employee-form-cancel"
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            id="employee-form-submit"
            type="submit"
            variant="brand"
            disabled={isPending || (isEdit && !isDirty)}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? "Saving..." : "Adding..."}</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? "Save Changes" : "Add Employee"}</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
