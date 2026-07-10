"""
SmartSeat AI — Seats, Buildings, Floors, Zones Routers (Firebase)
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import RequireAnyStaff, RequireHRAdmin
from app.services.seat_service import SeatService

router = APIRouter()
bldg_router = APIRouter()
floor_router = APIRouter()
zone_router = APIRouter()


def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> SeatService:
    return SeatService(db)


# ── Seats ──────────────────────────────────────────────────────────────────────
@router.get("", dependencies=[RequireAnyStaff])
async def list_seats(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    zone_id: Optional[str] = None,
    status: Optional[str] = None,
    seat_type: Optional[str] = None,
    search: Optional[str] = None,
    svc: Annotated[SeatService, Depends(_svc)] = None,
):
    return await svc.list_seats(page=page, page_size=page_size,
                                 zone_id=zone_id, status=status,
                                 seat_type=seat_type, search=search)


@router.get("/utilization", dependencies=[RequireAnyStaff])
async def seat_utilization(svc: Annotated[SeatService, Depends(_svc)] = None):
    return await svc.get_utilization()


@router.get("/{seat_id}", dependencies=[RequireAnyStaff])
async def get_seat(seat_id: str, svc: Annotated[SeatService, Depends(_svc)] = None):
    seat = await svc.get_seat(seat_id)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return seat


@router.post("", dependencies=[RequireHRAdmin], status_code=status.HTTP_201_CREATED)
async def create_seat(payload: dict, svc: Annotated[SeatService, Depends(_svc)] = None):
    return await svc.create_seat(payload)


@router.patch("/{seat_id}", dependencies=[RequireHRAdmin])
async def update_seat(seat_id: str, payload: dict, svc: Annotated[SeatService, Depends(_svc)] = None):
    seat = await svc.update_seat(seat_id, payload)
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return seat


# ── Buildings ──────────────────────────────────────────────────────────────────
@bldg_router.get("", dependencies=[RequireAnyStaff])
async def list_buildings(svc: Annotated[SeatService, Depends(_svc)] = None):
    return await svc.list_buildings()


@bldg_router.post("", dependencies=[RequireHRAdmin], status_code=201)
async def create_building(payload: dict, svc: Annotated[SeatService, Depends(_svc)] = None):
    return await svc.create_building(payload)


# ── Floors ─────────────────────────────────────────────────────────────────────
@floor_router.get("", dependencies=[RequireAnyStaff])
async def list_floors(
    building_id: Optional[str] = None,
    svc: Annotated[SeatService, Depends(_svc)] = None,
):
    return await svc.list_floors(building_id=building_id)


@floor_router.post("", dependencies=[RequireHRAdmin], status_code=201)
async def create_floor(payload: dict, svc: Annotated[SeatService, Depends(_svc)] = None):
    return await svc.create_floor(payload)


# ── Zones ──────────────────────────────────────────────────────────────────────
@zone_router.get("", dependencies=[RequireAnyStaff])
async def list_zones(
    floor_id: Optional[str] = None,
    svc: Annotated[SeatService, Depends(_svc)] = None,
):
    return await svc.list_zones(floor_id=floor_id)


@zone_router.post("", dependencies=[RequireHRAdmin], status_code=201)
async def create_zone(payload: dict, svc: Annotated[SeatService, Depends(_svc)] = None):
    return await svc.create_zone(payload)
