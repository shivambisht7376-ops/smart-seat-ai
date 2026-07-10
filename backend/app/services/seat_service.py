"""
SmartSeat AI — Seat Service (Firestore)
"""
import uuid
from datetime import datetime, UTC
from typing import Optional
from google.cloud.firestore import AsyncClient


class SeatError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _doc(doc) -> dict:
    return {"id": doc.id, **doc.to_dict()}


class SeatService:
    def __init__(self, db: AsyncClient):
        self.db = db

    async def list_seats(self, building_id: Optional[str] = None,
                         floor_id: Optional[str] = None,
                         zone_id: Optional[str] = None,
                         status: Optional[str] = None,
                         page: int = 1, page_size: int = 50) -> dict:
        query = self.db.collection("seats")
        if building_id: query = query.where("building_id", "==", building_id)
        if floor_id:    query = query.where("floor_id", "==", floor_id)
        if zone_id:     query = query.where("zone_id", "==", zone_id)
        if status:      query = query.where("status", "==", status)

        all_docs = [_doc(d) async for d in query.stream()]
        all_docs.sort(key=lambda x: x.get("name", ""))
        total = len(all_docs)
        offset = (page - 1) * page_size
        return {
            "items": all_docs[offset: offset + page_size],
            "total": total, "page": page, "page_size": page_size,
            "pages": max(1, -(-total // page_size)),
        }

    async def get_seat(self, seat_id: str) -> Optional[dict]:
        doc = await self.db.collection("seats").document(seat_id).get()
        return _doc(doc) if doc.exists else None

    async def create_seat(self, payload: dict) -> dict:
        seat_id = payload.get("id") or str(uuid.uuid4())
        payload["id"] = seat_id
        payload.setdefault("status", "available")
        payload.setdefault("created_at", datetime.now(UTC).isoformat())
        await self.db.collection("seats").document(seat_id).set(payload)
        return payload

    async def update_seat(self, seat_id: str, payload: dict) -> Optional[dict]:
        payload.pop("id", None)
        if payload:
            await self.db.collection("seats").document(seat_id).update(payload)
        return await self.get_seat(seat_id)
