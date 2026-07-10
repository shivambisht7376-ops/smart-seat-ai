"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  Mail,
  MapPin,
  Phone,
  User,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmploymentStatusBadge, BooleanBadge } from "@/components/shared/status-badge";
import { EmployeeFormModal } from "@/components/employees/employee-form-modal";
import { useEmployee } from "@/hooks/useEmployees";
import { useIsHRAdmin } from "@/store/auth";
import { formatDate, initials, timeAgo, cn } from "@/lib/utils";
import { useState } from "react";
import type { Employee } from "@/types";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[var(--color-primary)]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-medium">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-[var(--color-foreground)] font-medium">
          {value ?? <span className="text-[var(--color-muted-foreground)]">—</span>}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isHRAdmin = useIsHRAdmin();
  const { data: employee, isLoading } = useEmployee(id);
  const [showEdit, setShowEdit] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="skeleton h-8 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-muted-foreground)]">Employee not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const emp = employee as typeof employee & {
    full_name: string;
    department?: { name: string };
    designation?: { title: string };
    manager_name?: string;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button
          id="back-to-employees"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/employees")}
        >
          <ArrowLeft className="w-4 h-4" />
          All Employees
        </Button>
        {isHRAdmin && (
          <Button
            id="edit-employee-btn"
            variant="brand"
            size="sm"
            className="gap-2"
            onClick={() => setShowEdit(true)}
          >
            <Edit className="w-4 h-4" />
            Edit Employee
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--color-primary)]/20">
            {initials(emp.full_name || `${emp.first_name} ${emp.last_name}`)}
          </div>

          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              {emp.full_name || `${emp.first_name} ${emp.last_name}`}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
              {emp.designation?.title ?? "No Designation"}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-2.5 py-1 rounded-full">
              {emp.employee_id}
            </span>
            <EmploymentStatusBadge status={emp.employment_status} />
            {emp.is_new_joiner && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]">
                🆕 New Joiner
              </span>
            )}
          </div>

          {/* Quick stats */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-muted)_50%,transparent)] text-center">
              <p className="text-xs text-[var(--color-muted-foreground)]">Joined</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(emp.joining_date)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-muted)_50%,transparent)] text-center">
              <p className="text-xs text-[var(--color-muted-foreground)]">Added</p>
              <p className="text-sm font-semibold mt-0.5">{timeAgo(emp.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="glass-card p-6 lg:col-span-2 space-y-1">
          <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">
            Employee Details
          </h2>

          <InfoRow icon={Mail} label="Email" value={emp.email} />
          <InfoRow icon={Phone} label="Phone" value={emp.phone} />
          <InfoRow
            icon={Building2}
            label="Department"
            value={emp.department?.name}
          />
          <InfoRow
            icon={Briefcase}
            label="Designation"
            value={emp.designation?.title}
          />
          <InfoRow
            icon={User}
            label="Reporting Manager"
            value={emp.manager_name}
          />
          <InfoRow icon={MapPin} label="Location" value={emp.location} />
          <InfoRow
            icon={Calendar}
            label="Joining Date"
            value={formatDate(emp.joining_date, "MMMM d, yyyy")}
          />
        </div>
      </div>

      {/* Allocation + Project placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            Seat Allocation
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Active seat allocation details will appear here (Phase 5).
          </p>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
            Project Assignments
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Project mapping details will appear here (Phase 4).
          </p>
        </div>
      </div>

      {/* Edit modal */}
      <EmployeeFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        employee={employee as Employee}
      />
    </div>
  );
}
