"""
SmartSeat AI — Employee, Department & Designation Routers (Firebase)
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import CurrentUser, RequireHRAdmin, RequireAnyStaff
from app.services.employee_service import EmployeeService

router = APIRouter()
dept_router = APIRouter()
desig_router = APIRouter()


def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> EmployeeService:
    return EmployeeService(db)


# ── Employees ──────────────────────────────────────────────────────────────────
@router.get("", dependencies=[RequireAnyStaff])
async def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    employment_status: Optional[str] = None,
    svc: Annotated[EmployeeService, Depends(_svc)] = None,
):
    return await svc.list_employees(page=page, page_size=page_size,
                                     search=search, department_id=department_id,
                                     status=status, employment_status=employment_status)


@router.get("/unallocated", dependencies=[RequireAnyStaff])
async def get_unallocated_employees(svc: Annotated[EmployeeService, Depends(_svc)] = None):
    """Must be defined before /{employee_id} to avoid route conflict."""
    return await svc.get_unallocated_employees()


@router.get("/{employee_id}", dependencies=[RequireAnyStaff])
async def get_employee(employee_id: str, svc: Annotated[EmployeeService, Depends(_svc)] = None):
    emp = await svc.get_employee(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("", dependencies=[RequireHRAdmin], status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: dict,
    svc: Annotated[EmployeeService, Depends(_svc)] = None,
):
    return await svc.create_employee(payload)


@router.patch("/{employee_id}", dependencies=[RequireHRAdmin])
async def update_employee(
    employee_id: str,
    payload: dict,
    svc: Annotated[EmployeeService, Depends(_svc)] = None,
):
    emp = await svc.update_employee(employee_id, payload)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.delete("/{employee_id}", dependencies=[RequireHRAdmin], status_code=204)
async def delete_employee(employee_id: str, svc: Annotated[EmployeeService, Depends(_svc)] = None):
    ok = await svc.delete_employee(employee_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Employee not found")


@router.get("/{employee_id}/projects", dependencies=[RequireAnyStaff])
async def get_employee_projects(employee_id: str, svc: Annotated[EmployeeService, Depends(_svc)] = None):
    return await svc.get_employee_projects(employee_id)


@router.get("/{employee_id}/seat", dependencies=[RequireAnyStaff])
async def get_employee_seat(employee_id: str, svc: Annotated[EmployeeService, Depends(_svc)] = None):
    allocation = await svc.get_employee_allocation(employee_id)
    return allocation or {}


# ── Departments ────────────────────────────────────────────────────────────────
@dept_router.get("", dependencies=[RequireAnyStaff])
async def list_departments(svc: Annotated[EmployeeService, Depends(_svc)] = None):
    return await svc.list_departments()


@dept_router.post("", dependencies=[RequireHRAdmin], status_code=201)
async def create_department(payload: dict, svc: Annotated[EmployeeService, Depends(_svc)] = None):
    return await svc.create_department(payload.get("name", ""), payload.get("code", ""))


# ── Designations ───────────────────────────────────────────────────────────────
@desig_router.get("", dependencies=[RequireAnyStaff])
async def list_designations(
    department_id: Optional[str] = None,
    svc: Annotated[EmployeeService, Depends(_svc)] = None,
):
    return await svc.list_designations(department_id=department_id)


@desig_router.post("", dependencies=[RequireHRAdmin], status_code=201)
async def create_designation(payload: dict, svc: Annotated[EmployeeService, Depends(_svc)] = None):
    return await svc.create_designation(
        title=payload.get("title", ""),
        department_id=payload.get("department_id", ""),
        level=payload.get("level", 1),
    )
