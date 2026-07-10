"use client";

import { useState } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAllocateSeat } from "@/hooks/useAllocations";
import { useEmployees } from "@/hooks/useEmployees";
import { useAvailableSeats, useFloors, useBuildings } from "@/hooks/useSeats";
import { cn } from "@/lib/utils";

interface AllocateSeatModalProps {
  open: boolean;
  onClose: () => void;
  preselectedEmployeeId?: string;
}

export function AllocateSeatModal({ open, onClose, preselectedEmployeeId }: AllocateSeatModalProps) {
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId ?? "");
  const [seatId, setSeatId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState<number | undefined>();
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | undefined>();

  const { data: empData } = useEmployees({ page_size: 200, employment_status: "active" });
  const { data: buildings = [] } = useBuildings();
  const { data: floors = [] } = useFloors(selectedBuildingId);
  const { data: availData } = useAvailableSeats({ floor_id: selectedFloorId });
  const allocMutation = useAllocateSeat();

  const availableSeats = availData?.items ?? [];

  const selectCls = cn(
    "flex h-10 w-full rounded-lg border border-[var(--color-border)]",
    "bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
  );

  const handleSubmit = async () => {
    if (!employeeId || !seatId) return;
    await allocMutation.mutateAsync({ employee_id: employeeId, seat_id: seatId, notes: notes || undefined });
    setEmployeeId(preselectedEmployeeId ?? "");
    setSeatId("");
    setNotes("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Allocate Seat"
      description="Assign an available seat to an employee." size="md" id="allocate-seat-modal">
      <div className="space-y-5">
        {/* Employee */}
        <div className="space-y-1.5">
          <Label htmlFor="alloc-emp">Employee *</Label>
          <select id="alloc-emp" value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)} className={selectCls}>
            <option value="">— Select Employee —</option>
            {(empData?.items ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name || `${e.first_name} ${e.last_name}`} · {e.employee_id}
              </option>
            ))}
          </select>
        </div>

        {/* Building + Floor cascade */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="alloc-building">Building</Label>
            <select id="alloc-building" value={selectedBuildingId ?? ""}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value ? Number(e.target.value) : undefined);
                setSelectedFloorId(undefined);
                setSeatId("");
              }} className={selectCls}>
              <option value="">All Buildings</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alloc-floor">Floor</Label>
            <select id="alloc-floor" value={selectedFloorId ?? ""}
              onChange={(e) => {
                setSelectedFloorId(e.target.value ? Number(e.target.value) : undefined);
                setSeatId("");
              }} className={selectCls}>
              <option value="">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>{f.name ?? `Floor ${f.floor_number}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Seat */}
        <div className="space-y-1.5">
          <Label htmlFor="alloc-seat">
            Available Seat *{" "}
            <span className="text-[var(--color-muted-foreground)] font-normal">
              ({availableSeats.length} available)
            </span>
          </Label>
          <select id="alloc-seat" value={seatId}
            onChange={(e) => setSeatId(e.target.value)} className={selectCls}>
            <option value="">— Select Seat —</option>
            {availableSeats.map((s) => (
              <option key={s.id} value={s.id}>
                {s.seat_number}
                {s.zone_name ? ` · ${s.zone_name}` : ""}
                {s.floor_name ? ` · ${s.floor_name}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="alloc-notes">Notes</Label>
          <textarea id="alloc-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2} placeholder="Optional notes…"
            className={cn("w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm",
              "bg-[var(--color-background)] text-[var(--color-foreground)] resize-none",
              "placeholder:text-[var(--color-muted-foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]")} />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
          <Button id="alloc-cancel" variant="ghost" onClick={onClose} disabled={allocMutation.isPending}>
            Cancel
          </Button>
          <Button id="alloc-submit" variant="brand"
            onClick={handleSubmit}
            disabled={!employeeId || !seatId || allocMutation.isPending}>
            {allocMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Allocating…</>
              : <><UserCheck className="w-4 h-4" />Confirm Allocation</>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
