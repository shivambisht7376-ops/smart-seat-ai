"""
SmartSeat AI — Projects Router (Firebase)
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import RequireAnyStaff, RequireProjectManager
from app.services.project_service import ProjectService

router = APIRouter()


def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> ProjectService:
    return ProjectService(db)


@router.get("", dependencies=[RequireAnyStaff])
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    svc: Annotated[ProjectService, Depends(_svc)] = None,
):
    return await svc.list_projects(page=page, page_size=page_size, search=search, status=status)


@router.get("/{project_id}", dependencies=[RequireAnyStaff])
async def get_project(project_id: str, svc: Annotated[ProjectService, Depends(_svc)] = None):
    p = await svc.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@router.post("", dependencies=[RequireProjectManager], status_code=status.HTTP_201_CREATED)
async def create_project(payload: dict, svc: Annotated[ProjectService, Depends(_svc)] = None):
    return await svc.create_project(payload)


@router.patch("/{project_id}", dependencies=[RequireProjectManager])
async def update_project(
    project_id: str, payload: dict,
    svc: Annotated[ProjectService, Depends(_svc)] = None,
):
    p = await svc.update_project(project_id, payload)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@router.delete("/{project_id}", dependencies=[RequireProjectManager], status_code=204)
async def delete_project(project_id: str, svc: Annotated[ProjectService, Depends(_svc)] = None):
    ok = await svc.delete_project(project_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Project not found")


@router.get("/{project_id}/members", dependencies=[RequireAnyStaff])
async def get_members(project_id: str, svc: Annotated[ProjectService, Depends(_svc)] = None):
    return await svc.get_project_members(project_id)


@router.post("/{project_id}/members", dependencies=[RequireProjectManager], status_code=201)
async def add_member(
    project_id: str, payload: dict,
    svc: Annotated[ProjectService, Depends(_svc)] = None,
):
    return await svc.add_member(
        project_id=project_id,
        employee_id=payload.get("employee_id"),
        role_in_project=payload.get("role_in_project", "Developer"),
        allocation_pct=payload.get("allocation_percentage", 100),
    )


@router.delete("/{project_id}/members/{employee_id}", dependencies=[RequireProjectManager], status_code=204)
async def remove_member(
    project_id: str, employee_id: str,
    svc: Annotated[ProjectService, Depends(_svc)] = None,
):
    await svc.remove_member(project_id, employee_id)
