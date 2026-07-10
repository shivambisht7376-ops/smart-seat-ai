"""
SmartSeat AI — Audit Log Router (Firebase Firestore)
"""
import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from typing import Annotated
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import RequireAnyStaff, RequireHRAdmin


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: str


router = APIRouter()


@router.get("", dependencies=[RequireHRAdmin])
async def list_audit_logs(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Annotated[AsyncClient, Depends(get_db)] = None,
):
    query = db.collection("audit_logs")
    if action:
        query = query.where("action", "==", action.upper())
    if entity_type:
        query = query.where("entity_type", "==", entity_type)

    docs = await query.get()
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    total = len(items)
    start = (page - 1) * page_size
    return {
        "items": items[start:start + page_size],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/actions", dependencies=[RequireAnyStaff])
async def get_audit_actions():
    return {
        "actions": ["CREATE", "UPDATE", "DELETE", "ALLOCATE", "RELEASE", "TRANSFER", "LOGIN", "LOGOUT"],
        "entity_types": ["employee", "project", "seat", "allocation", "user"],
    }
