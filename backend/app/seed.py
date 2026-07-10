#!/usr/bin/env python3
"""
SmartSeat AI — Firestore Seed Script
Populates Firebase Firestore with:
  4 roles, 3 users, 12 departments, ~60 designations,
  5 buildings, 20 floors, 80 zones, 2000 seats,
  500 employees, 50 projects, ~1300 allocations, 30 new-joiners
"""
import asyncio, uuid, random, os, sys
from datetime import date, timedelta, datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import firebase_admin
from firebase_admin import credentials, firestore as fs
from passlib.context import CryptContext

CRED_PATH = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")

FIRST_NAMES = ["Aarav","Aditya","Akash","Amara","Ananya","Ankit","Arjun","Arya",
    "Ayesha","Bhavya","Carlos","Chen","David","Deepa","Divya","Elena",
    "Eshan","Fatima","Gaurav","Harini","Ishaan","Jasmine","Jay","Karan",
    "Kavya","Lakshmi","Leo","Manav","Maya","Meera","Mohan","Nadia",
    "Nikhil","Nisha","Oliver","Pavan","Priya","Rahul","Riya","Rohan",
    "Sakshi","Sana","Sara","Shiv","Sneha","Sofia","Tanvi","Tarun",
    "Uma","Varun","Vikram","Wei","Yuki","Zara","Zoe","Amit","Neha"]

LAST_NAMES = ["Sharma","Patel","Kumar","Singh","Mehta","Gupta","Shah","Joshi",
    "Verma","Nair","Reddy","Agarwal","Mishra","Rao","Iyer","Pillai",
    "Bose","Das","Roy","Smith","Johnson","Williams","Brown","Garcia",
    "Wang","Chen","Kim","Park","Tanaka","Ali","Khan","Ahmed"]

DEPARTMENTS = [
    ("Engineering","ENG"), ("Product","PRD"), ("Design","DES"),
    ("Marketing","MKT"), ("Sales","SLS"), ("Finance","FIN"),
    ("Human Resources","HR"), ("Operations","OPS"), ("Legal","LGL"),
    ("Customer Success","CS"), ("Data Science","DS"), ("Infrastructure","INF"),
]

DESIGNATIONS = {
    "Engineering":    [("Software Engineer I",1),("Software Engineer II",2),("Senior Engineer",3),("Staff Engineer",4),("Principal Engineer",5),("Engineering Manager",6)],
    "Product":        [("Associate PM",1),("Product Manager",2),("Senior PM",3),("Group PM",4),("VP Product",5)],
    "Design":         [("UI Designer",1),("UX Designer",2),("Senior Designer",3),("Design Lead",4),("Head of Design",5)],
    "Marketing":      [("Marketing Analyst",1),("Marketing Manager",2),("Senior Marketing Manager",3),("VP Marketing",4)],
    "Sales":          [("Sales Representative",1),("Account Executive",2),("Senior AE",3),("Sales Manager",4),("VP Sales",5)],
    "Finance":        [("Finance Analyst",1),("Senior Analyst",2),("Finance Manager",3),("CFO",4)],
    "Human Resources":[("HR Executive",1),("HR Manager",2),("Senior HR Manager",3),("HR Director",4),("CHRO",5)],
    "Operations":     [("Operations Analyst",1),("Operations Manager",2),("Senior OM",3),("VP Operations",4)],
    "Legal":          [("Legal Counsel",1),("Senior Counsel",2),("Legal Manager",3),("General Counsel",4)],
    "Customer Success":[("CS Rep",1),("CS Manager",2),("Senior CSM",3),("VP CS",4)],
    "Data Science":   [("Data Analyst",1),("Data Scientist",2),("Senior DS",3),("ML Engineer",4),("Principal DS",5)],
    "Infrastructure": [("DevOps Engineer",1),("SRE",2),("Senior SRE",3),("Infra Lead",4),("VP Engineering",5)],
}

PROJECT_TEMPLATES = [
    ("Platform Modernisation","PLT","Technology"), ("Mobile App Relaunch","MAR","Product"),
    ("AI/ML Pipeline","AML","Data Science"), ("Data Warehouse Migration","DWM","Infrastructure"),
    ("Customer Portal v3","CPV3","Product"), ("Global Compliance System","GCS","Legal"),
    ("Sales Force Automation","SFA","Sales"), ("Marketing Analytics Suite","MAS","Marketing"),
    ("HR Self-Service Portal","HSP","Human Resources"), ("API Gateway Overhaul","AGO","Engineering"),
    ("Security Hardening","SEC","Infrastructure"), ("Finance Reconciliation Tool","FRT","Finance"),
    ("Employee Engagement App","EEA","Human Resources"), ("Real-Time Reporting Dashboard","RRD","Data Science"),
    ("Partner Integration Hub","PIH","Engineering"), ("Cloud Cost Optimisation","CCO","Infrastructure"),
    ("Brand Redesign 2025","BR25","Design"), ("Revenue Operations Platform","ROP","Finance"),
    ("Global Expansion Programme","GEP","Operations"), ("Customer 360 View","C360","Customer Success"),
]

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

BATCH_SIZE = 400  # Firestore batch limit is 500


async def seed(n_employees=500, n_seats=2000, n_projects=50):
    print("🌱 SmartSeat AI — Seeding Firestore ...")

    cred = credentials.Certificate(CRED_PATH)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {"projectId": "smartseat-ai-5818c"})
    db = fs.AsyncClient(project="smartseat-ai-5818c")

    # ── 1. Users ───────────────────────────────────────────────────────────────
    print("  Creating users ...")
    users = [
        {"email": "admin@smartseat.ai",    "password": "Admin@123",  "role": "super_admin"},
        {"email": "hr@smartseat.ai",        "password": "Hr@123456",  "role": "hr_admin"},
        {"email": "pm@smartseat.ai",        "password": "Pm@123456",  "role": "project_manager"},
        {"email": "employee@smartseat.ai",  "password": "Emp@123456", "role": "employee"},
    ]
    user_ids = {}
    for u in users:
        uid = str(uuid.uuid4())
        await db.collection("users").document(uid).set({
            "id": uid,
            "email": u["email"],
            "hashed_password": pwd_ctx.hash(u["password"]),
            "role": u["role"],
            "is_active": True,
            "refresh_token_hash": None,
            "last_login": None,
            "created_at": datetime.utcnow().isoformat(),
        })
        user_ids[u["role"]] = uid
    admin_id = user_ids["super_admin"]
    print(f"    ✓ {len(users)} users created")

    # ── 2. Departments + Designations ─────────────────────────────────────────
    print("  Creating departments + designations ...")
    dept_ids = {}
    desig_ids = {}
    for dept_name, dept_code in DEPARTMENTS:
        did = str(uuid.uuid4())
        await db.collection("departments").document(did).set({
            "id": did, "name": dept_name, "code": dept_code,
            "created_at": datetime.utcnow().isoformat(),
        })
        dept_ids[dept_name] = did
        desig_ids[dept_name] = []
        for title, level in DESIGNATIONS.get(dept_name, []):
            xid = str(uuid.uuid4())
            await db.collection("designations").document(xid).set({
                "id": xid, "title": title, "level": level, "department_id": did,
            })
            desig_ids[dept_name].append(xid)
    print(f"    ✓ {len(DEPARTMENTS)} departments, designations created")

    # ── 3. Buildings → Floors → Zones ─────────────────────────────────────────
    print("  Creating buildings → floors → zones ...")
    building_data = [
        ("Alpha Tower","Plot 12, Tech Park","Bengaluru"),
        ("Beta Campus","IT Hub, Whitefield","Bengaluru"),
        ("Gamma Plaza","Bandra Kurla Complex","Mumbai"),
        ("Delta Hub","Cyber City","Hyderabad"),
        ("Epsilon Centre","Gachibowli","Hyderabad"),
    ]
    zone_names = ["Zone A","Zone B","Zone C","Zone D","Zone E","Zone F"]
    zone_ids = []

    for bname, baddr, bcity in building_data:
        bid = str(uuid.uuid4())
        await db.collection("buildings").document(bid).set({
            "id": bid, "name": bname, "address": baddr, "city": bcity,
            "total_floors": 4, "created_at": datetime.utcnow().isoformat(),
        })
        for fnum in range(1, 5):
            fid = str(uuid.uuid4())
            await db.collection("floors").document(fid).set({
                "id": fid, "building_id": bid, "floor_number": fnum,
                "name": f"Floor {fnum}", "total_seats": 100,
            })
            for zname in random.sample(zone_names, 4):
                zid = str(uuid.uuid4())
                await db.collection("zones").document(zid).set({
                    "id": zid, "floor_id": fid, "name": zname, "capacity": 25,
                })
                zone_ids.append(zid)
    print(f"    ✓ {len(building_data)} buildings, {len(zone_ids)} zones")

    # ── 4. Seats ───────────────────────────────────────────────────────────────
    print(f"  Creating {n_seats} seats ...")
    seat_types = ["standard","standard","standard","standing","hot_desk","cabin"]
    all_seat_ids = []
    batch = db.batch()
    count = 0
    for i in range(n_seats):
        sid = str(uuid.uuid4())
        all_seat_ids.append(sid)
        batch.set(db.collection("seats").document(sid), {
            "id": sid,
            "seat_number": f"S{i+1:04d}",
            "zone_id": zone_ids[i % len(zone_ids)],
            "seat_type": random.choice(seat_types),
            "status": "available",
            "created_at": datetime.utcnow().isoformat(),
        })
        count += 1
        if count >= BATCH_SIZE:
            await batch.commit()
            batch = db.batch()
            count = 0
            print(f"      … seats {i+1}/{n_seats}")
    if count:
        await batch.commit()
    print(f"    ✓ {n_seats} seats created")

    # ── 5. Employees ───────────────────────────────────────────────────────────
    print(f"  Creating {n_employees} employees ...")
    emp_ids = []
    statuses = ["active"] * 8 + ["inactive", "on_leave"]
    batch = db.batch()
    count = 0
    for i in range(n_employees):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        dept_name = random.choice(list(dept_ids.keys()))
        eid = str(uuid.uuid4())
        join_date = date.today() - timedelta(days=random.randint(30, 1800))
        emp_status = random.choice(statuses)
        is_new = (date.today() - join_date).days < 30
        batch.set(db.collection("employees").document(eid), {
            "id": eid,
            "employee_id": f"EMP{i+1001:05d}",
            "first_name": first,
            "last_name": last,
            "email": f"{first.lower()}.{last.lower()}{i}@smartseat.ai",
            "department_id": dept_ids[dept_name],
            "designation_id": random.choice(desig_ids[dept_name]) if desig_ids[dept_name] else None,
            "employment_status": emp_status,
            "joining_date": join_date.isoformat(),
            "is_new_joiner": is_new,
            "deleted_at": None,
            "created_at": datetime.utcnow().isoformat(),
        })
        emp_ids.append((eid, emp_status, is_new))
        count += 1
        if count >= BATCH_SIZE:
            await batch.commit()
            batch = db.batch()
            count = 0
            print(f"      … employees {i+1}/{n_employees}")
    if count:
        await batch.commit()
    print(f"    ✓ {n_employees} employees created")

    # ── 6. Seat Allocations ────────────────────────────────────────────────────
    print("  Allocating seats ...")
    active_emps = [eid for eid, s, _ in emp_ids if s == "active"]
    shuffle_seats = list(all_seat_ids)
    random.shuffle(shuffle_seats)
    random.shuffle(active_emps)
    n_alloc = min(len(active_emps), len(shuffle_seats), int(n_seats * 0.65))

    batch = db.batch()
    count = 0
    for i in range(n_alloc):
        aid = str(uuid.uuid4())
        sid = shuffle_seats[i]
        adate = date.today() - timedelta(days=random.randint(0, 365))
        batch.set(db.collection("seat_allocations").document(aid), {
            "id": aid, "employee_id": active_emps[i], "seat_id": sid,
            "allocated_by": admin_id, "is_active": True,
            "allocated_date": adate.isoformat(),
        })
        batch.update(db.collection("seats").document(sid), {"status": "occupied"})
        count += 2
        if count >= BATCH_SIZE:
            await batch.commit()
            batch = db.batch()
            count = 0
    if count:
        await batch.commit()
    print(f"    ✓ {n_alloc} seat allocations")

    # ── 7. Projects ────────────────────────────────────────────────────────────
    print(f"  Creating {n_projects} projects ...")
    templates = PROJECT_TEMPLATES * ((n_projects // len(PROJECT_TEMPLATES)) + 1)
    proj_statuses = ["active"] * 6 + ["planning"] * 2 + ["on_hold", "completed"]
    batch = db.batch()
    count = 0
    project_ids = []
    for i in range(n_projects):
        name, code, dept = templates[i]
        if i >= len(PROJECT_TEMPLATES):
            code = f"{code}-{i:02d}"
            name = f"{name} {i}"
        pid = str(uuid.uuid4())
        start_d = date.today() - timedelta(days=random.randint(30, 365))
        batch.set(db.collection("projects").document(pid), {
            "id": pid, "project_code": code, "name": name,
            "client_name": f"Client {random.randint(100,999)}",
            "status": random.choice(proj_statuses),
            "project_manager_id": random.choice(active_emps) if active_emps else None,
            "start_date": start_d.isoformat(),
            "end_date": (start_d + timedelta(days=random.randint(90, 540))).isoformat(),
            "resource_count": random.randint(3, 25),
            "deleted_at": None,
            "created_at": datetime.utcnow().isoformat(),
        })
        project_ids.append(pid)
        count += 1
        if count >= BATCH_SIZE:
            await batch.commit()
            batch = db.batch()
            count = 0
    if count:
        await batch.commit()

    # Assign members
    batch = db.batch()
    count = 0
    for pid in project_ids:
        for eid in random.sample(active_emps, min(8, len(active_emps))):
            mid = str(uuid.uuid4())
            batch.set(db.collection("employee_projects").document(mid), {
                "id": mid, "project_id": pid, "employee_id": eid,
                "role_in_project": random.choice(["Developer","Tester","Designer","Analyst","Lead"]),
                "allocation_percentage": random.choice([25, 50, 75, 100]),
                "is_active": True, "is_primary": False,
                "allocated_date": datetime.utcnow().isoformat(),
            })
            count += 1
            if count >= BATCH_SIZE:
                await batch.commit()
                batch = db.batch()
                count = 0
    if count:
        await batch.commit()
    print(f"    ✓ {n_projects} projects with member assignments")

    # ── 8. New Joiners ─────────────────────────────────────────────────────────
    print("  Creating new joiner queue ...")
    new_joiner_emps = [eid for eid, _, is_new in emp_ids if is_new][:30]
    for eid in new_joiner_emps:
        nid = str(uuid.uuid4())
        await db.collection("new_joiners").document(nid).set({
            "id": nid, "employee_id": eid, "status": "pending",
            "expected_joining_date": (date.today() + timedelta(days=random.randint(1, 14))).isoformat(),
            "notes": "Auto-created by seed script",
            "created_at": datetime.utcnow().isoformat(),
        })
    print(f"    ✓ {len(new_joiner_emps)} new joiners")

    print("\n✅ Firestore seeding complete!\n")
    print("  Login credentials:")
    print("    admin@smartseat.ai    / Admin@123")
    print("    hr@smartseat.ai       / Hr@123456")
    print("    pm@smartseat.ai       / Pm@123456")
    print("    employee@smartseat.ai / Emp@123456")

    await db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--employees", type=int, default=500)
    parser.add_argument("--seats",     type=int, default=2000)
    parser.add_argument("--projects",  type=int, default=50)
    args = parser.parse_args()
    asyncio.run(seed(args.employees, args.seats, args.projects))
