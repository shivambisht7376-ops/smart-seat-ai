"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  Edit,
  User,
  UserPlus,
  Users,
  X,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { AssignEmployeeModal } from "@/components/projects/assign-employee-modal";
import { useProject, useRemoveEmployee } from "@/hooks/useProjects";
import { useIsProjectManager } from "@/store/auth";
import { formatDate, formatCurrency, initials, timeAgo, cn } from "@/lib/utils";
import type { Project, EmployeeProject } from "@/types";

function MetaCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-muted)_30%,transparent)] flex items-center gap-3">
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
        accent ?? "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
      )}>
        <Icon className="w-4 h-4 text-[var(--color-primary)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-foreground)] mt-0.5">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  onRemove,
  canRemove,
}: {
  member: EmployeeProject;
  onRemove: (empId: string) => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[color-mix(in_srgb,var(--color-muted)_20%,transparent)] transition-colors group">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold shrink-0">
        {initials(member.employee_name ?? "?")}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-foreground)]">
          {member.employee_name}
          {member.is_primary && (
            <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]">
              Primary
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)] truncate">
          {member.employee_code} · {member.designation_title ?? member.department_name ?? "—"}
          {member.role_in_project ? ` · ${member.role_in_project}` : ""}
        </p>
      </div>

      {/* Allocation bar */}
      <div className="w-28 hidden sm:block">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--color-muted-foreground)]">Allocation</span>
          <span className="text-xs font-semibold text-[var(--color-primary)]">
            {member.allocation_percentage}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-gradient-brand"
            style={{ width: `${member.allocation_percentage}%` }}
          />
        </div>
      </div>

      {/* Date */}
      <div className="text-xs text-[var(--color-muted-foreground)] hidden md:block w-24 text-right">
        {formatDate(member.allocated_date)}
      </div>

      {/* Remove */}
      {canRemove && (
        <button
          id={`remove-member-${member.employee_id}`}
          onClick={() => onRemove(String(member.employee_id))}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-destructive)_12%,transparent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-all"
          aria-label={`Remove ${member.employee_name}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isPM = useIsProjectManager();

  const { data: project, isLoading } = useProject(id);
  const removeMutation = useRemoveEmployee(id);
  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const handleRemoveMember = async (employeeId: string) => {
    if (confirm("Remove this employee from the project?")) {
      await removeMutation.mutateAsync(employeeId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in max-w-5xl">
        <div className="skeleton h-9 w-48 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-muted-foreground)]">Project not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const p = project as Project;
  const members = (p.members ?? []) as EmployeeProject[];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button
          id="back-to-projects"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/projects")}
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </Button>
        {isPM && (
          <div className="flex gap-2">
            <Button
              id="assign-member-btn"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowAssign(true)}
            >
              <UserPlus className="w-4 h-4" />
              Assign Member
            </Button>
            <Button
              id="edit-project-btn"
              variant="brand"
              size="sm"
              className="gap-2"
              onClick={() => setShowEdit(true)}
            >
              <Edit className="w-4 h-4" />
              Edit Project
            </Button>
          </div>
        )}
      </div>

      {/* Project Header Card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shrink-0 shadow-lg shadow-[var(--color-primary)]/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-semibold text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-2.5 py-0.5 rounded-full">
                {p.project_code}
              </span>
              <ProjectStatusBadge status={p.status} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] mt-2 leading-tight">
              {p.name}
            </h1>
            {p.client_name && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Client: <span className="text-[var(--color-foreground)] font-medium">{p.client_name}</span>
              </p>
            )}
            {p.description && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-3 leading-relaxed">
                {p.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaCard icon={User} label="Manager" value={p.project_manager_name ?? "Unassigned"} />
        <MetaCard icon={Users} label="Team Size" value={`${members.length} members`} />
        <MetaCard
          icon={Calendar}
          label="Timeline"
          value={
            p.start_date && p.end_date
              ? `${formatDate(p.start_date)} → ${formatDate(p.end_date)}`
              : p.start_date
              ? `From ${formatDate(p.start_date)}`
              : "Not set"
          }
        />
        <MetaCard
          icon={DollarSign}
          label="Budget"
          value={p.budget ? formatCurrency(p.budget) : "Not set"}
        />
      </div>

      {/* Team Roster */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">
              Team Members
            </h2>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              {members.length} active member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isPM && (
            <Button
              id="assign-member-btn-2"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowAssign(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </Button>
          )}
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--color-muted)_50%,transparent)] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[var(--color-muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No team members assigned yet.
            </p>
            {isPM && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => setShowAssign(true)}
              >
                <UserPlus className="w-4 h-4" />
                Assign first member
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <MemberRow
                key={String(m.id)}
                member={m}
                onRemove={handleRemoveMember}
                canRemove={isPM}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectFormModal open={showEdit} onClose={() => setShowEdit(false)} project={p} />
      <AssignEmployeeModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        projectId={id}
        existingMembers={members}
      />
    </div>
  );
}
