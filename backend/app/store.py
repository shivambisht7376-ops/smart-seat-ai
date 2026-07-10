"""
SmartSeat AI — Global In-Memory Data Store
Pre-seeded with demo accounts and enterprise data.
"""
import uuid
import datetime
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _now():
    return datetime.datetime.now(datetime.UTC).isoformat()

# ── Users (demo accounts, always available) ───────────────────────────────────
USERS = [
    {
        "id": "user-admin-001",
        "email": "admin@smartseat.ai",
        "hashed_password": pwd_ctx.hash("Admin@123"),
        "role": "super_admin",
        "is_active": True,
        "refresh_token_hash": None,
        "last_login": None,
        "created_at": _now(),
    },
    {
        "id": "user-hr-001",
        "email": "hr@smartseat.ai",
        "hashed_password": pwd_ctx.hash("Hr@123456"),
        "role": "hr_admin",
        "is_active": True,
        "refresh_token_hash": None,
        "last_login": None,
        "created_at": _now(),
    },
    {
        "id": "user-pm-001",
        "email": "pm@smartseat.ai",
        "hashed_password": pwd_ctx.hash("Pm@123456"),
        "role": "project_manager",
        "is_active": True,
        "refresh_token_hash": None,
        "last_login": None,
        "created_at": _now(),
    },
    {
        "id": "user-emp-001",
        "email": "employee@smartseat.ai",
        "hashed_password": pwd_ctx.hash("Emp@123456"),
        "role": "employee",
        "is_active": True,
        "refresh_token_hash": None,
        "last_login": None,
        "created_at": _now(),
    },
]

# ── Departments ───────────────────────────────────────────────────────────────
DEPT_NAMES = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Legal"]
DEPARTMENTS = [{"id": f"dept-{i+1:03d}", "name": n, "description": f"{n} Department", "created_at": _now()} for i, n in enumerate(DEPT_NAMES)]

# ── Designations ──────────────────────────────────────────────────────────────
TITLES = ["Junior", "Mid-Level", "Senior", "Lead", "Principal", "Director"]
DESIGNATIONS = []
for dept in DEPARTMENTS:
    for title in TITLES:
        DESIGNATIONS.append({
            "id": str(uuid.uuid4()),
            "name": f"{title} Specialist",
            "department_id": dept["id"],
            "created_at": _now(),
        })

# ── Seats (10,000) ────────────────────────────────────────────────────────────
import random
random.seed(42)
BUILDINGS = ["HQ-A", "HQ-B", "HQ-C"]
FLOORS = ["1", "2", "3", "4", "5"]
ZONES = ["North", "South", "East", "West"]

SEATS = []
for i in range(10000):
    SEATS.append({
        "id": str(uuid.uuid4()),
        "name": f"Seat-{i+1}",
        "building_id": random.choice(BUILDINGS),
        "floor_id": random.choice(FLOORS),
        "zone_id": random.choice(ZONES),
        "status": "available",
        "created_at": _now(),
    })

# ── Projects (150) ────────────────────────────────────────────────────────────
PROJECT_STATUSES = ["active", "planning", "completed"]
PROJECTS = []
for i in range(150):
    PROJECTS.append({
        "id": str(uuid.uuid4()),
        "name": f"Project Alpha {i+1}",
        "description": "Enterprise Initiative",
        "status": random.choice(PROJECT_STATUSES),
        "department_id": random.choice(DEPARTMENTS)["id"],
        "start_date": _now(),
        "created_at": _now(),
    })

# ── Employees (500) with Seat Allocations ─────────────────────────────────────
FIRST_NAMES = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda",
               "William","Elizabeth","David","Barbara","Richard","Susan","Joseph",
               "Jessica","Thomas","Sarah","Charles","Karen"]
LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
              "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
              "Thomas","Taylor","Moore","Jackson","Martin"]

EMPLOYEES = []
ALLOCATIONS = []

_shuffled_seats = SEATS[:500]  # first 500 seats assigned to employees

for i in range(500):
    eid = str(uuid.uuid4())
    fname = random.choice(FIRST_NAMES)
    lname = random.choice(LAST_NAMES)
    dept = random.choice(DEPARTMENTS)
    is_new_joiner = random.random() < 0.1
    emp_projects = random.sample([p["id"] for p in PROJECTS], random.randint(1, 3))

    EMPLOYEES.append({
        "id": eid,
        "first_name": fname,
        "last_name": lname,
        "email": f"{fname.lower()}.{lname.lower()}{i}@smartseat.ai",
        "department_id": dept["id"],
        "designation_id": random.choice(DESIGNATIONS)["id"],
        "project_ids": emp_projects,
        "status": "onboarding" if is_new_joiner else "active",
        "joined_at": _now(),
        "created_at": _now(),
    })

    seat = _shuffled_seats[i]
    seat["status"] = "occupied"
    ALLOCATIONS.append({
        "id": str(uuid.uuid4()),
        "employee_id": eid,
        "seat_id": seat["id"],
        "status": "active",
        "start_date": _now(),
    })

# ── Master Store dict (shared mutable state) ──────────────────────────────────
STORE = {
    "users": USERS,
    "departments": DEPARTMENTS,
    "designations": DESIGNATIONS,
    "seats": SEATS,
    "projects": PROJECTS,
    "employees": EMPLOYEES,
    "allocations": ALLOCATIONS,
    "audit_logs": [],
}
