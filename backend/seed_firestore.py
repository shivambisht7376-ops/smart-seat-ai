"""
SmartSeat AI — Firestore Seed Script
Seeds all collections: users, departments, designations, seats, projects, employees, allocations
"""
import asyncio
import uuid
import random
import datetime
import os
import json
from passlib.context import CryptContext
import firebase_admin
from firebase_admin import credentials
from google.cloud.firestore import AsyncClient
from google.oauth2 import service_account

random.seed(42)
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
CRED_PATH = os.path.join(os.path.dirname(__file__), "firebase_credentials.json")

def now():
    return datetime.datetime.now(datetime.UTC).isoformat()

async def batch_set(db: AsyncClient, collection: str, docs: list):
    """Write docs in batches of 400 (safe under 500 limit)."""
    for i in range(0, len(docs), 400):
        batch = db.batch()
        chunk = docs[i:i + 400]
        for doc in chunk:
            ref = db.collection(collection).document(doc["id"])
            batch.set(ref, doc)
        await batch.commit()
        print(f"  {collection}: committed {min(i+400, len(docs))}/{len(docs)}")

async def seed():
    print("Initializing Firebase...")
    if not firebase_admin._apps:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred)
    
    svc_creds = service_account.Credentials.from_service_account_file(
        CRED_PATH,
        scopes=["https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/datastore"],
    )
    db = AsyncClient(project="smartseat-ai-9b63e", credentials=svc_creds)
    print("Connected to Firestore.")

    # ── Demo users ─────────────────────────────────────────────────────────────
    print("\nSeeding users...")
    demo_users = [
        {"id": "user-admin-001", "email": "admin@smartseat.ai",     "hashed_password": pwd_ctx.hash("Admin@123"),  "role": "super_admin",      "is_active": True, "refresh_token_hash": None, "last_login": None, "created_at": now()},
        {"id": "user-hr-001",    "email": "hr@smartseat.ai",        "hashed_password": pwd_ctx.hash("Hr@123456"),  "role": "hr_admin",         "is_active": True, "refresh_token_hash": None, "last_login": None, "created_at": now()},
        {"id": "user-pm-001",    "email": "pm@smartseat.ai",        "hashed_password": pwd_ctx.hash("Pm@123456"),  "role": "project_manager",  "is_active": True, "refresh_token_hash": None, "last_login": None, "created_at": now()},
        {"id": "user-emp-001",   "email": "employee@smartseat.ai",  "hashed_password": pwd_ctx.hash("Emp@123456"), "role": "employee",         "is_active": True, "refresh_token_hash": None, "last_login": None, "created_at": now()},
    ]
    await batch_set(db, "users", demo_users)

    # ── Departments ─────────────────────────────────────────────────────────────
    print("Seeding departments...")
    dept_names = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Legal"]
    dept_ids = [str(uuid.uuid4()) for _ in dept_names]
    depts = [{"id": did, "name": name, "description": f"{name} Dept", "created_at": now()}
             for did, name in zip(dept_ids, dept_names)]
    await batch_set(db, "departments", depts)

    # ── Designations ────────────────────────────────────────────────────────────
    print("Seeding designations...")
    titles = ["Junior", "Mid-Level", "Senior", "Lead", "Principal", "Director"]
    desigs = []
    desig_ids = []
    for did in dept_ids:
        for t in titles:
            desig_id = str(uuid.uuid4())
            desig_ids.append(desig_id)
            desigs.append({"id": desig_id, "name": f"{t} Specialist", "department_id": did, "created_at": now()})
    await batch_set(db, "designations", desigs)

    # ── 10,000 Seats ────────────────────────────────────────────────────────────
    print("Seeding 10,000 seats...")
    buildings = ["HQ-A", "HQ-B", "HQ-C"]
    floors = ["1", "2", "3", "4", "5"]
    zones = ["North", "South", "East", "West"]
    seat_records = []
    for i in range(10000):
        seat_records.append({
            "id": str(uuid.uuid4()), "name": f"Seat-{i+1}",
            "building_id": random.choice(buildings), "floor_id": random.choice(floors),
            "zone_id": random.choice(zones), "status": "available", "created_at": now()
        })
    await batch_set(db, "seats", seat_records)

    # ── 150 Projects ────────────────────────────────────────────────────────────
    print("Seeding 150 projects...")
    statuses = ["active", "planning", "completed"]
    project_ids = []
    projects = []
    for i in range(150):
        pid = str(uuid.uuid4())
        project_ids.append(pid)
        projects.append({
            "id": pid, "name": f"Project Alpha {i+1}", "description": "Enterprise Initiative",
            "status": random.choice(statuses), "department_id": random.choice(dept_ids),
            "start_date": now(), "created_at": now()
        })
    await batch_set(db, "projects", projects)

    # ── 500 Employees ───────────────────────────────────────────────────────────
    print("Seeding 500 employees...")
    first_names = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda",
                   "William","Elizabeth","David","Barbara","Richard","Susan","Joseph"]
    last_names  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
                   "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson"]
    
    employees = []
    emp_ids = []
    for i in range(500):
        eid = str(uuid.uuid4())
        emp_ids.append(eid)
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        pids = random.sample(project_ids, random.randint(1, 3))
        employees.append({
            "id": eid, "first_name": fname, "last_name": lname,
            "email": f"{fname.lower()}.{lname.lower()}{i}@smartseat.ai",
            "department_id": random.choice(dept_ids), "designation_id": random.choice(desig_ids),
            "status": "onboarding" if random.random() < 0.1 else "active",
            "project_ids": pids, "joined_at": now(), "created_at": now()
        })
    await batch_set(db, "employees", employees)

    # ── 500 Allocations + mark seats occupied ──────────────────────────────────
    print("Seeding 500 seat allocations...")
    allocs = []
    for i in range(500):
        allocs.append({
            "id": str(uuid.uuid4()), "employee_id": emp_ids[i],
            "seat_id": seat_records[i]["id"], "status": "active", "start_date": now()
        })
    await batch_set(db, "allocations", allocs)

    print("Marking seats as occupied...")
    for i in range(0, 500, 400):
        batch = db.batch()
        for alloc in allocs[i:i+400]:
            ref = db.collection("seats").document(alloc["seat_id"])
            batch.update(ref, {"status": "occupied"})
        await batch.commit()

    await db.close()
    print("\nFirestore seeding complete!")
    print(f"  Users       : {len(demo_users)}")
    print(f"  Departments : {len(depts)}")
    print(f"  Designations: {len(desigs)}")
    print(f"  Seats       : 10,000 (500 occupied)")
    print(f"  Projects    : 150")
    print(f"  Employees   : 500")
    print(f"  Allocations : 500")


if __name__ == "__main__":
    asyncio.run(seed())
