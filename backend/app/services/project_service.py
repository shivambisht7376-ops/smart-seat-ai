"""
SmartSeat AI — Project Service (Firestore)
"""
import uuid
from datetime import datetime, UTC
from typing import Optional
from google.cloud.firestore import AsyncClient


class ProjectError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _doc(doc) -> dict:
    return {"id": doc.id, **doc.to_dict()}


class ProjectService:
    def __init__(self, db: AsyncClient):
        self.db = db

    async def list_projects(self, department_id: Optional[str] = None,
                            status: Optional[str] = None,
                            page: int = 1, page_size: int = 20) -> dict:
        query = self.db.collection("projects")
        if department_id: query = query.where("department_id", "==", department_id)
        if status:        query = query.where("status", "==", status)

        all_docs = [_doc(d) async for d in query.stream()]
        all_docs.sort(key=lambda x: x.get("name", ""))
        total = len(all_docs)
        offset = (page - 1) * page_size
        return {
            "items": all_docs[offset: offset + page_size],
            "total": total, "page": page, "page_size": page_size,
            "pages": max(1, -(-total // page_size)),
        }

    async def get_project(self, project_id: str) -> Optional[dict]:
        doc = await self.db.collection("projects").document(project_id).get()
        return _doc(doc) if doc.exists else None

    async def create_project(self, payload: dict) -> dict:
        pid = payload.get("id") or str(uuid.uuid4())
        payload["id"] = pid
        payload.setdefault("status", "active")
        payload.setdefault("created_at", datetime.now(UTC).isoformat())
        await self.db.collection("projects").document(pid).set(payload)
        return payload

    async def update_project(self, project_id: str, payload: dict) -> Optional[dict]:
        payload.pop("id", None)
        if payload:
            await self.db.collection("projects").document(project_id).update(payload)
        return await self.get_project(project_id)
