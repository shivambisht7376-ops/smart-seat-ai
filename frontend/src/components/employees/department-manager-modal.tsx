"use client";

import { useState } from "react";
import { Building2, Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks/useEmployees";
import type { Department } from "@/types";
import { cn } from "@/lib/utils";

interface DepartmentManagerModalProps {
  open: boolean;
  onClose: () => void;
}

interface DeptForm {
  name: string;
  code: string;
}

export function DepartmentManagerModal({ open, onClose }: DepartmentManagerModalProps) {
  const { data: departments = [], isLoading } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeptForm>({ name: "", code: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleStartEdit = (dept: Department) => {
    setEditingId(dept.id);
    setForm({ name: dept.name, code: dept.code ?? "" });
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setForm({ name: "", code: "" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm({ name: "", code: "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: form });
      setEditingId(null);
    } else {
      await createMutation.mutateAsync(form);
      setShowAddForm(false);
    }
    setForm({ name: "", code: "" });
  };

  const handleDelete = async (dept: Department) => {
    if (confirm(`Delete "${dept.name}" department? This cannot be undone.`)) {
      await deleteMutation.mutateAsync(dept.id);
    }
  };

  const inputCls = cn(
    "flex h-9 w-full rounded-lg border border-[var(--color-border)]",
    "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
    "placeholder:text-[var(--color-muted-foreground)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Departments"
      description="Add, rename, or remove departments in your organisation."
      size="md"
      id="dept-manager-modal"
    >
      <div className="space-y-4">
        {/* Department list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-[var(--color-muted-foreground)]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : departments.length === 0 ? (
            <p className="text-sm text-center py-6 text-[var(--color-muted-foreground)]">
              No departments yet. Add one below!
            </p>
          ) : (
            departments.map((dept) =>
              editingId === dept.id ? (
                /* ── Inline edit row ── */
                <div
                  key={dept.id}
                  className="flex items-center gap-2 p-3 rounded-xl border-2 border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                >
                  <div className="flex gap-2 flex-1 min-w-0">
                    <input
                      id={`dept-edit-name-${dept.id}`}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Department name"
                      className={cn(inputCls, "flex-1")}
                      autoFocus
                    />
                    <input
                      id={`dept-edit-code-${dept.id}`}
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder="Code"
                      className={cn(inputCls, "w-24")}
                    />
                  </div>
                  <Button
                    id={`dept-save-${dept.id}`}
                    variant="brand"
                    size="sm"
                    className="h-8 px-3 text-xs shrink-0"
                    onClick={handleSave}
                    disabled={isPending || !form.name.trim()}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    id={`dept-cancel-${dept.id}`}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                /* ── Read row ── */
                <div
                  key={dept.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] group hover:border-[var(--color-primary)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                      {dept.name}
                    </p>
                    {dept.code && (
                      <p className="text-xs text-[var(--color-muted-foreground)] font-mono">
                        {dept.code}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      id={`dept-edit-btn-${dept.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleStartEdit(dept)}
                      disabled={isPending}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      id={`dept-delete-btn-${dept.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_10%,transparent)]"
                      onClick={() => handleDelete(dept)}
                      disabled={isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* Add new department form */}
        {showAddForm ? (
          <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              New Department
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-dept-name">Name *</Label>
                <Input
                  id="new-dept-name"
                  placeholder="e.g. Engineering"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-dept-code">Code</Label>
                <Input
                  id="new-dept-code"
                  placeholder="e.g. ENG"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                id="add-dept-cancel"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                id="add-dept-save"
                variant="brand"
                size="sm"
                onClick={handleSave}
                disabled={isPending || !form.name.trim()}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add Department</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-[var(--color-border)] pt-4">
            <Button
              id="show-add-dept-form"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleStartAdd}
              disabled={isPending}
            >
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
