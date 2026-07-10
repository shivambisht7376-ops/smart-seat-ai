"""
SmartSeat AI — Employee Service (Firestore)
"""
import uuid
from datetime import datetime, UTC
from typing import Optional, List
from google.cloud.firestore import AsyncClient


class EmployeeError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _doc(doc) -> dict:
    return {"id": doc.id, **doc.to_dict()}


class EmployeeService:
    def __init__(self, db: AsyncClient):
        self.db = db

    # ── Employees ──────────────────────────────────────────────────────────────
    async def list_employees(self, page: int = 1, page_size: int = 20,
                              search: Optional[str] = None,
                              department_id: Optional[str] = None,
                              status: Optional[str] = None,
                              employment_status: Optional[str] = None) -> dict:
        query = self.db.collection("employees")
        # Support both status and employment_status params
        effective_status = status or employment_status
        if department_id:
            query = query.where("department_id", "==", department_id)
        if effective_status:
            query = query.where("status", "==", effective_status)

        all_docs = [_doc(d) async for d in query.stream()]

        if search:
            sl = search.lower()
            all_docs = [d for d in all_docs if
                        sl in d.get("first_name", "").lower() or
                        sl in d.get("last_name", "").lower() or
                        sl in d.get("email", "").lower()]

        # Enrich with computed fields the frontend expects
        for d in all_docs:
            d.setdefault("full_name", f"{d.get('first_name','')} {d.get('last_name','')}".strip())
            d.setdefault("employee_id", d.get("id", "")[:8].upper())
            d.setdefault("employment_status", d.get("status", "active"))
            d.setdefault("joining_date", d.get("joined_at", d.get("created_at", "")))
            d.setdefault("is_new_joiner", d.get("status") == "onboarding")

        all_docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        total = len(all_docs)
        offset = (page - 1) * page_size
        items = all_docs[offset: offset + page_size]

        return {
            "items": items, "total": total,
            "page": page, "page_size": page_size,
            "pages": max(1, -(-total // page_size)),
            "total_pages": max(1, -(-total // page_size)),
            "has_next": offset + page_size < total,
            "has_prev": page > 1,
        }

    async def get_employee(self, employee_id: str) -> Optional[dict]:
        doc = await self.db.collection("employees").document(employee_id).get()
        if not doc.exists:
            return None
        d = _doc(doc)
        d.setdefault("full_name", f"{d.get('first_name','')} {d.get('last_name','')}".strip())
        d.setdefault("employee_id", d.get("id", "")[:8].upper())
        d.setdefault("employment_status", d.get("status", "active"))
        d.setdefault("joining_date", d.get("joined_at", d.get("created_at", "")))
        d.setdefault("is_new_joiner", d.get("status") == "onboarding")
        return d

    async def create_employee(self, payload: dict) -> dict:
        emp_id = payload.get("id") or str(uuid.uuid4())
        payload["id"] = emp_id
        payload.setdefault("status", "active")
        payload.setdefault("employment_status", "active")
        payload.setdefault("project_ids", [])
        payload.setdefault("created_at", datetime.now(UTC).isoformat())
        # Compute full_name
        fn = payload.get("first_name", "")
        ln = payload.get("last_name", "")
        payload.setdefault("full_name", f"{fn} {ln}".strip())
        payload.setdefault("employee_id", emp_id[:8].upper())
        await self.db.collection("employees").document(emp_id).set(payload)
        return payload

    async def update_employee(self, employee_id: str, payload: dict) -> Optional[dict]:
        payload.pop("id", None)
        # Sync status ↔ employment_status
        if "employment_status" in payload and "status" not in payload:
            payload["status"] = payload["employment_status"]
        if "status" in payload and "employment_status" not in payload:
            payload["employment_status"] = payload["status"]
        if payload:
            await self.db.collection("employees").document(employee_id).update(payload)
        return await self.get_employee(employee_id)

    async def delete_employee(self, employee_id: str) -> bool:
        """
        Terminate an employee:
        - Set status to 'terminated'
        - Release any active seat allocation
        """
        doc = await self.db.collection("employees").document(employee_id).get()
        if not doc.exists:
            return False

        # Mark employee as terminated
        await self.db.collection("employees").document(employee_id).update({
            "status": "terminated",
            "employment_status": "terminated",
            "terminated_at": datetime.now(UTC).isoformat(),
        })

        # Release active seat allocation if any
        active_allocs = [d async for d in
                         self.db.collection("allocations")
                         .where("employee_id", "==", employee_id)
                         .where("status", "==", "active").limit(1).stream()]
        if active_allocs:
            alloc = active_allocs[0]
            alloc_data = alloc.to_dict()
            await self.db.collection("allocations").document(alloc.id).update({
                "status": "terminated",
                "end_date": datetime.now(UTC).isoformat(),
            })
            # Free the seat
            seat_id = alloc_data.get("seat_id")
            if seat_id:
                await self.db.collection("seats").document(seat_id).update({"status": "available"})

        return True

    async def get_employee_projects(self, employee_id: str) -> List[dict]:
        """Return all projects this employee belongs to."""
        emp = await self.get_employee(employee_id)
        if not emp:
            return []
        project_ids = emp.get("project_ids", [])
        projects = []
        for pid in project_ids:
            pdoc = await self.db.collection("projects").document(pid).get()
            if pdoc.exists:
                p = _doc(pdoc)
                projects.append({
                    "id": str(uuid.uuid4()),
                    "employee_id": employee_id,
                    "project_id": pid,
                    "project": p,
                    "allocation_percentage": 100,
                    "is_primary": True,
                    "is_active": p.get("status") == "active",
                    "allocated_date": emp.get("created_at", ""),
                })
        return projects

    async def get_employee_allocation(self, employee_id: str) -> Optional[dict]:
        """Return the active seat allocation for an employee."""
        docs = [d async for d in
                self.db.collection("allocations")
                .where("employee_id", "==", employee_id)
                .where("status", "==", "active").limit(1).stream()]
        if not docs:
            return None
        alloc = _doc(docs[0])
        # Enrich with seat details
        seat_id = alloc.get("seat_id")
        if seat_id:
            sdoc = await self.db.collection("seats").document(seat_id).get()
            if sdoc.exists:
                alloc["seat"] = _doc(sdoc)
        return alloc

    async def get_unallocated_employees(self) -> List[dict]:
        """Return employees with no active seat allocation."""
        all_emps = [_doc(d) async for d in
                    self.db.collection("employees").where("status", "==", "active").stream()]
        active_allocs = set()
        async for d in self.db.collection("allocations").where("status", "==", "active").stream():
            active_allocs.add(d.to_dict().get("employee_id"))
        return [e for e in all_emps if e["id"] not in active_allocs]

    # ── Departments ────────────────────────────────────────────────────────────
    async def list_departments(self) -> List[dict]:
        docs = [_doc(d) async for d in self.db.collection("departments").stream()]
        return sorted(docs, key=lambda x: x.get("name", ""))

    async def get_department(self, dept_id: str) -> Optional[dict]:
        doc = await self.db.collection("departments").document(dept_id).get()
        return _doc(doc) if doc.exists else None

    async def create_department(self, name: str = "", code: str = "", payload: dict = None) -> dict:
        if payload:
            name = payload.get("name", name)
            code = payload.get("code", code)
        dept_id = str(uuid.uuid4())
        dept = {"id": dept_id, "name": name, "code": code,
                "created_at": datetime.now(UTC).isoformat()}
        await self.db.collection("departments").document(dept_id).set(dept)
        return dept

    async def update_department(self, dept_id: str, payload: dict) -> Optional[dict]:
        payload.pop("id", None)
        if payload:
            await self.db.collection("departments").document(dept_id).update(payload)
        return await self.get_department(dept_id)

    # ── Designations ───────────────────────────────────────────────────────────
    async def list_designations(self, department_id: Optional[str] = None) -> List[dict]:
        if department_id:
            docs = [_doc(d) async for d in
                    self.db.collection("designations").where("department_id", "==", department_id).stream()]
        else:
            docs = [_doc(d) async for d in self.db.collection("designations").stream()]
        return sorted(docs, key=lambda x: x.get("name", ""))

    async def get_designation(self, desig_id: str) -> Optional[dict]:
        doc = await self.db.collection("designations").document(desig_id).get()
        return _doc(doc) if doc.exists else None

    async def create_designation(self, title: str = "", department_id: str = "",
                                  level: int = 1, payload: dict = None) -> dict:
        if payload:
            title = payload.get("title", title) or payload.get("name", title)
            department_id = payload.get("department_id", department_id)
            level = payload.get("level", level)
        desig_id = str(uuid.uuid4())
        desig = {"id": desig_id, "name": title, "title": title,
                 "department_id": department_id, "level": level,
                 "created_at": datetime.now(UTC).isoformat()}
        await self.db.collection("designations").document(desig_id).set(desig)
        return desig

    async def update_designation(self, desig_id: str, payload: dict) -> Optional[dict]:
        payload.pop("id", None)
        if payload:
            await self.db.collection("designations").document(desig_id).update(payload)
        return await self.get_designation(desig_id)
