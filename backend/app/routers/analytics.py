"""
SmartSeat AI — Analytics Router (PostgreSQL / asyncpg)
"""
from google.cloud.firestore import AsyncClient
from typing import Annotated
from fastapi import APIRouter, Depends
from app.database import get_db
from app.dependencies import RequireAnyStaff
from app.services.analytics_service import AnalyticsService

router = APIRouter()


def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> AnalyticsService:
    return AnalyticsService(db)


@router.get("/dashboard", dependencies=[RequireAnyStaff])
async def dashboard_stats(svc: Annotated[AnalyticsService, Depends(_svc)]):
    return await svc.get_dashboard_summary()


@router.get("/departments", dependencies=[RequireAnyStaff])
async def department_distribution(svc: Annotated[AnalyticsService, Depends(_svc)]):
    return await svc.get_department_breakdown()


@router.get("/seats/utilization", dependencies=[RequireAnyStaff])
async def seat_utilization(svc: Annotated[AnalyticsService, Depends(_svc)]):
    return await svc.get_seat_type_breakdown()


@router.get("/employment-status", dependencies=[RequireAnyStaff])
async def employment_status(svc: Annotated[AnalyticsService, Depends(_svc)]):
    return await svc.get_employment_status_breakdown()


@router.get("/projects", dependencies=[RequireAnyStaff])
async def project_stats(svc: Annotated[AnalyticsService, Depends(_svc)]):
    return await svc.get_project_status_breakdown()


@router.get("/utilization-trend", dependencies=[RequireAnyStaff])
async def utilization_trend(
    days: int = 30,
    svc: Annotated[AnalyticsService, Depends(_svc)] = None,
):
    return await svc.get_utilization_trend(days)
