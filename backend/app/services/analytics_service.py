"""
SmartSeat AI — Analytics Service (Firestore)
Returns exactly the field names the frontend expects.
"""
import asyncio
from typing import Dict, Any, List
from google.cloud.firestore import AsyncClient


def _doc(doc) -> dict:
    return {"id": doc.id, **doc.to_dict()}


class AnalyticsService:
    def __init__(self, db: AsyncClient):
        self.db = db

    async def _count(self, collection: str, **filters) -> int:
        try:
            query = self.db.collection(collection)
            for field, value in filters.items():
                query = query.where(field, "==", value)
            agg = await query.count().get()
            return agg[0][0].value
        except Exception:
            count = 0
            query2 = self.db.collection(collection)
            for field, value in filters.items():
                query2 = query2.where(field, "==", value)
            async for _ in query2.stream():
                count += 1
            return count

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        (total_seats, occupied_seats, available_seats,
         total_employees, active_employees, new_joiners,
         total_projects, active_projects, active_allocs) = await asyncio.gather(
            self._count("seats"),
            self._count("seats", status="occupied"),
            self._count("seats", status="available"),
            self._count("employees"),
            self._count("employees", status="active"),
            self._count("employees", status="onboarding"),
            self._count("projects"),
            self._count("projects", status="active"),
            self._count("allocations", status="active"),
        )
        unallocated     = max(0, total_employees - active_allocs)
        seat_util_pct   = round(occupied_seats / total_seats * 100, 1) if total_seats > 0 else 0.0
        alloc_rate_pct  = round(active_allocs / total_employees * 100, 1) if total_employees > 0 else 0.0

        return {
            "total_employees":       total_employees,
            "active_employees":      active_employees,
            "seat_utilization_pct":  seat_util_pct,
            "occupied_seats":        occupied_seats,
            "available_seats":       available_seats,
            "total_seats":           total_seats,
            "active_projects":       active_projects,
            "total_projects":        total_projects,
            "allocation_rate_pct":   alloc_rate_pct,
            "active_allocations":    active_allocs,
            "unallocated_employees": unallocated,
            "new_joiners_pending":   new_joiners,
        }

    async def get_department_breakdown(self) -> List[dict]:
        depts = [_doc(d) async for d in self.db.collection("departments").stream()]
        emps  = [_doc(d) async for d in self.db.collection("employees").stream()]
        counts = {d["id"]: 0 for d in depts}
        names  = {d["id"]: d["name"] for d in depts}
        for e in emps:
            did = e.get("department_id")
            if did in counts:
                counts[did] += 1
        total = max(sum(counts.values()), 1)
        result = [{"department": names[k], "count": v, "percentage": round(v/total*100, 1)}
                  for k, v in counts.items()]
        return sorted(result, key=lambda x: x["count"], reverse=True)

    async def get_seat_type_breakdown(self) -> List[dict]:
        seats = [_doc(d) async for d in self.db.collection("seats").stream()]
        floors: Dict[tuple, dict] = {}
        for s in seats:
            key = (s.get("building_id", "Unknown"), s.get("floor_id", "?"))
            if key not in floors:
                floors[key] = {"total": 0, "occupied": 0, "available": 0, "reserved": 0, "maintenance": 0}
            floors[key]["total"] += 1
            st = s.get("status", "available")
            if st in floors[key]:
                floors[key][st] += 1
        result = [
            {"floor_id": f, "floor_name": f"Floor {f}", "building_name": b,
             "total": d["total"], "occupied": d["occupied"],
             "available": d["available"], "reserved": d["reserved"], "maintenance": d["maintenance"],
             "utilization_pct": round(d["occupied"]/d["total"]*100, 1) if d["total"] > 0 else 0}
            for (b, f), d in floors.items()
        ]
        return sorted(result, key=lambda x: (x["building_name"], x["floor_id"]))

    async def get_employment_status_breakdown(self) -> List[dict]:
        counts: Dict[str, int] = {}
        async for d in self.db.collection("employees").stream():
            st = d.to_dict().get("status", "unknown")
            counts[st] = counts.get(st, 0) + 1
        return sorted([{"status": k, "count": v} for k, v in counts.items()],
                      key=lambda x: x["count"], reverse=True)

    async def get_project_status_breakdown(self) -> List[dict]:
        projs = {d.id: _doc(d) async for d in
                 self.db.collection("projects").where("status", "==", "active").stream()}
        # count employees per project via employee project_ids field
        p_counts = {pid: 0 for pid in projs}
        async for d in self.db.collection("employees").stream():
            for pid in d.to_dict().get("project_ids", []):
                if pid in p_counts:
                    p_counts[pid] += 1
        result = [{"project_name": projs[pid]["name"], "project_code": projs[pid]["name"][:8],
                   "status": "active", "active_employees": p_counts[pid]}
                  for pid in projs]
        return sorted(result, key=lambda x: x["active_employees"], reverse=True)[:10]

    async def get_utilization_trend(self, days: int = 30) -> List[dict]:
        total    = await self._count("seats")
        occupied = await self._count("seats", status="occupied")
        rate = round(occupied / total * 100, 1) if total > 0 else 0
        return [{"date": "Today", "utilization": rate, "occupied": occupied, "total": total}]
