"use client";

import { useState } from "react";
import { Loader2, UserPlus, X, Briefcase } from "lucide-react";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAssignEmployee } from "@/hooks/useProjects";
import { useEmployees } from "@/hooks/useEmployees";
import { initials, cn } from "@/lib/utils";
import type { EmployeeProject } from "@/types";

interface AssignEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  existingMembers: EmployeeProject[];
}

export function AssignEmployeeModal({
  open,
  onClose,
  projectId,
  existingMembers,
}: AssignEmployeeModalProps) {
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [role, setRole] = useState("");
  const [allocationPct, setAllocationPct] = useState(100);
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: empData } = useEmployees({ page_size: 200, employment_status: "active" });
  const assignMutation = useAssignEmployee(projectId);

  const existingIds = new Set(existingMembers.map((m) => String(m.employee_id)));
  const availableEmployees = (empData?.items ?? []).filter(
    (e) => !existingIds.has(e.id)
  );

  const handleAssign = async () => {
    if (!selectedEmpId) return;
    await assignMutation.mutateAsync({
      employee_id: selectedEmpId,
      role_in_project: role || undefined,
      allocation_percentage: allocationPct,
      is_primary: isPrimary,
    });
    setSelectedEmpId("");
    setRole("");
    setAllocationPct(100);
    setIsPrimary(false);
    onClose();
  };

  const selectedEmp = availableEmployees.find((e) => e.id === selectedEmpId);

  const inputCls = cn(
    "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
    "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Employee"
      description="Add a team member to this project."
      size="md"
      id="assign-employee-modal"
    >
      <div className="space-y-5">
        {/* Employee Select */}
        <div className="space-y-1.5">
          <Label htmlFor="assign-emp-select">Employee *</Label>
          <select
            id="assign-emp-select"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Search & Select Employee —</option>
            {availableEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name || `${e.first_name} ${e.last_name}`} · {e.employee_id}
                {e.department?.name ? ` · ${e.department.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Selected employee preview */}
        {selectedEmp && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
            <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials(selectedEmp.full_name || `${selectedEmp.first_name} ${selectedEmp.last_name}`)}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {selectedEmp.full_name || `${selectedEmp.first_name} ${selectedEmp.last_name}`}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {selectedEmp.employee_id} · {selectedEmp.department?.name ?? "No Department"}
              </p>
            </div>
          </div>
        )}

        {/* Role */}
        <div className="space-y-1.5">
          <Label htmlFor="assign-role">Role in Project</Label>
          <input
            id="assign-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Tech Lead, Backend Developer…"
            className={inputCls}
          />
        </div>

        {/* Allocation % */}
        <div className="space-y-1.5">
          <Label htmlFor="assign-alloc">
            Allocation{" "}
            <span className="text-[var(--color-primary)] font-semibold">{allocationPct}%</span>
          </Label>
          <input
            id="assign-alloc"
            type="range"
            min={10}
            max={100}
            step={10}
            value={allocationPct}
            onChange={(e) => setAllocationPct(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
          <div className="flex justify-between text-xs text-[var(--color-muted-foreground)]">
            <span>10%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Primary */}
        <label
          htmlFor="assign-primary"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
            "border border-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors"
          )}
        >
          <input
            id="assign-primary"
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--color-primary)]"
          />
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">Primary assignment</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              This is the employee's main project
            </p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
          <Button id="assign-cancel" variant="ghost" onClick={onClose} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button
            id="assign-submit"
            variant="brand"
            onClick={handleAssign}
            disabled={!selectedEmpId || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Assigning…</>
            ) : (
              <><UserPlus className="w-4 h-4" />Assign Member</>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
