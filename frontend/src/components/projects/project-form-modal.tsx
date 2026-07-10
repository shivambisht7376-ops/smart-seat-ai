"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectSchema, type CreateProjectData } from "@/lib/validations";
import { useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
];

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  const isEdit = !!project;
  const { data: employeeData } = useEmployees({ page_size: 200, employment_status: "active" });
  const managers = employeeData?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateProjectData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createProjectSchema) as any,
    defaultValues: { status: "active", project_code: "", name: "" },
  });

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(project?.id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (project) {
      reset({
        project_code: project.project_code,
        name: project.name,
        client_name: project.client_name ?? "",
        project_manager_id: project.project_manager_id ?? "",
        status: project.status,
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        budget: project.budget ?? undefined,
        description: project.description ?? "",
      });
    } else {
      reset({ status: "active", project_code: "", name: "" });
    }
  }, [project, reset, open]);

  const onSubmit = async (data: CreateProjectData) => {
    const payload = {
      ...data,
      project_manager_id: data.project_manager_id || undefined,
      budget: data.budget ? Number(data.budget) : undefined,
    };
    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const selectCls = cn(
    "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
    "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${project?.name}` : "Create New Project"}
      description={isEdit ? project?.project_code : "Fill in the project details below."}
      size="lg"
      id="project-form-modal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Code + Name */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-code">Project Code *</Label>
            <Input id="proj-code" placeholder="PRJ-001" {...register("project_code")}
              className={errors.project_code ? "border-[var(--color-destructive)]" : ""} />
            {errors.project_code && <p className="text-xs text-[var(--color-destructive)]">{errors.project_code.message}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="proj-name">Project Name *</Label>
            <Input id="proj-name" placeholder="SmartSeat Platform v2" {...register("name")}
              className={errors.name ? "border-[var(--color-destructive)]" : ""} />
            {errors.name && <p className="text-xs text-[var(--color-destructive)]">{errors.name.message}</p>}
          </div>
        </div>

        {/* Client + Manager */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-client">Client Name</Label>
            <Input id="proj-client" placeholder="Acme Corp" {...register("client_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-manager">Project Manager</Label>
            <select id="proj-manager" {...register("project_manager_id")} className={selectCls}>
              <option value="">— Select Manager —</option>
              {managers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name || `${e.first_name} ${e.last_name}`} ({e.employee_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates + Budget */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-start">Start Date</Label>
            <Input id="proj-start" type="date" {...register("start_date")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-end">End Date</Label>
            <Input id="proj-end" type="date" {...register("end_date")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-budget">Budget (₹)</Label>
            <Input id="proj-budget" type="number" placeholder="5000000" {...register("budget", { valueAsNumber: true })} />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label htmlFor="proj-status">Status</Label>
          <select id="proj-status" {...register("status")} className={selectCls}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="proj-desc">Description</Label>
          <textarea
            id="proj-desc"
            {...register("description")}
            rows={3}
            placeholder="Brief project description…"
            className={cn(
              "w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm",
              "bg-[var(--color-background)] text-[var(--color-foreground)]",
              "placeholder:text-[var(--color-muted-foreground)] resize-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
          <Button id="proj-form-cancel" type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button id="proj-form-submit" type="submit" variant="brand" disabled={isPending || (isEdit && !isDirty)}>
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />{isEdit ? "Save Changes" : "Create Project"}</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
