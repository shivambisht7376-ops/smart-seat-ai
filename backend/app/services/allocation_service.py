"""
SmartSeat AI — Allocation Service (Firestore)
"""
import uuid
from datetime import datetime, UTC
from typing import Optional
from google.cloud.firestore import AsyncClient


class AllocationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _doc(doc) -> dict:
    return {"id": doc.id, **doc.to_dict()}


class AllocationService:
    def __init__(self, db: AsyncClient):
        self.db = db

    async def list_allocations(self, employee_id: Optional[str] = None,
                               seat_id: Optional[str] = None,
                               status: Optional[str] = None,
                               page: int = 1, page_size: int = 20) -> dict:
        query = self.db.collection("allocations")
        if employee_id: query = query.where("employee_id", "==", employee_id)
        if seat_id:     query = query.where("seat_id", "==", seat_id)
        if status:      query = query.where("status", "==", status)

        all_docs = [_doc(d) async for d in query.stream()]
        all_docs.sort(key=lambda x: x.get("start_date", ""), reverse=True)
        total = len(all_docs)
        offset = (page - 1) * page_size
        return {
            "items": all_docs[offset: offset + page_size],
            "total": total, "page": page, "page_size": page_size,
            "pages": max(1, -(-total // page_size)),
        }

    async def get_allocation(self, allocation_id: str) -> Optional[dict]:
        doc = await self.db.collection("allocations").document(allocation_id).get()
        return _doc(doc) if doc.exists else None

    async def create_allocation(self, payload: dict) -> dict:
        seat_id = payload.get("seat_id")
        emp_id  = payload.get("employee_id")

        # Check seat not already active
        active_seat = [d async for d in
                       self.db.collection("allocations")
                       .where("seat_id", "==", seat_id)
                       .where("status", "==", "active").limit(1).stream()]
        if active_seat:
            raise AllocationError("Seat is already allocated", 409)

        # Check employee not already active
        active_emp = [d async for d in
                      self.db.collection("allocations")
                      .where("employee_id", "==", emp_id)
                      .where("status", "==", "active").limit(1).stream()]
        if active_emp:
            raise AllocationError("Employee already has an active allocation", 409)

        alloc_id   = str(uuid.uuid4())
        start_date = datetime.now(UTC).isoformat()
        alloc_doc  = {"id": alloc_id, "employee_id": emp_id, "seat_id": seat_id,
                      "status": "active", "start_date": start_date}

        await self.db.collection("allocations").document(alloc_id).set(alloc_doc)
        await self.db.collection("seats").document(seat_id).update({"status": "occupied"})
        return alloc_doc

    async def terminate_allocation(self, allocation_id: str) -> dict:
        alloc = await self.get_allocation(allocation_id)
        if not alloc:
            raise AllocationError("Allocation not found", 404)
        if alloc.get("status") != "active":
            raise AllocationError("Allocation is not active", 400)

        end_date = datetime.now(UTC).isoformat()
        await self.db.collection("allocations").document(allocation_id).update(
            {"status": "terminated", "end_date": end_date})
        await self.db.collection("seats").document(alloc["seat_id"]).update({"status": "available"})
        alloc.update({"status": "terminated", "end_date": end_date})
        return alloc
