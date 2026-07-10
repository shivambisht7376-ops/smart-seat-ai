"""
SmartSeat AI — Allocations & New Joiners Routers (Firebase)
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import CurrentUser, RequireAnyStaff, RequireHRAdmin
from app.services.allocation_service import AllocationService

router = APIRouter()
nj_router = APIRouter()


def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> AllocationService:
    return AllocationService(db)


# ── Allocations ────────────────────────────────────────────────────────────────
@router.get("", dependencies=[RequireAnyStaff])
async def list_allocations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    employee_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    svc: Annotated[AllocationService, Depends(_svc)] = None,
):
    return await svc.list_allocations(page=page, page_size=page_size,
                                       employee_id=employee_id, is_active=is_active)


@router.post("", dependencies=[RequireHRAdmin], status_code=status.HTTP_201_CREATED)
async def allocate_seat(
    payload: dict,
    current_user: CurrentUser,
    svc: Annotated[AllocationService, Depends(_svc)] = None,
):
    try:
        return await svc.allocate_seat(
            employee_id=payload.get("employee_id"),
            seat_id=payload.get("seat_id"),
            allocated_by=current_user.id,
            notes=payload.get("notes"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{allocation_id}", dependencies=[RequireHRAdmin], status_code=204)
async def release_seat(allocation_id: str, svc: Annotated[AllocationService, Depends(_svc)] = None):
    ok = await svc.release_seat(allocation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Allocation not found")


@router.post("/transfer", dependencies=[RequireHRAdmin], status_code=201)
async def transfer_seat(
    payload: dict,
    current_user: CurrentUser,
    svc: Annotated[AllocationService, Depends(_svc)] = None,
):
    try:
        return await svc.transfer_seat(
            employee_id=payload.get("employee_id"),
            new_seat_id=payload.get("new_seat_id"),
            transferred_by=current_user.id,
            notes=payload.get("notes"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── New Joiners ────────────────────────────────────────────────────────────────
@nj_router.get("", dependencies=[RequireHRAdmin])
async def list_new_joiners(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    svc: Annotated[AllocationService, Depends(_svc)] = None,
):
    return await svc.list_new_joiners(page=page, page_size=page_size, status=status)


@nj_router.post("", dependencies=[RequireHRAdmin], status_code=201)
async def create_new_joiner(payload: dict, svc: Annotated[AllocationService, Depends(_svc)] = None):
    return await svc.create_new_joiner(payload)


@nj_router.patch("/{nj_id}", dependencies=[RequireHRAdmin])
async def update_new_joiner(
    nj_id: str, payload: dict,
    svc: Annotated[AllocationService, Depends(_svc)] = None,
):
    result = await svc.update_new_joiner(nj_id, payload)
    if not result:
        raise HTTPException(status_code=404, detail="New joiner not found")
    return result


@nj_router.post("/{nj_id}/assign-seat", dependencies=[RequireHRAdmin], status_code=201)
async def assign_seat_to_new_joiner(
    nj_id: str,
    payload: dict,
    current_user: CurrentUser,
    svc: Annotated[AllocationService, Depends(_svc)] = None,
):
    try:
        return await svc.assign_seat_to_new_joiner(
            nj_id=nj_id,
            seat_id=payload.get("seat_id"),
            assigned_by=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
