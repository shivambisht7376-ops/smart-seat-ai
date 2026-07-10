import asyncio
import uuid
import random
import datetime
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Legal"]
TITLES = ["Junior", "Mid-Level", "Senior", "Lead", "Principal", "Director"]

async def seed():
    uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
    db = client[os.environ.get("MONGODB_DB_NAME", "smartseat")]
    
    print("Clearing existing data (except users)...")
    await db["departments"].delete_many({})
    await db["designations"].delete_many({})
    await db["seats"].delete_many({})
    await db["projects"].delete_many({})
    await db["employees"].delete_many({})
    await db["allocations"].delete_many({})
    
    # Generate Departments
    print("Generating Departments...")
    dept_ids = []
    for dept_name in DEPARTMENTS:
        did = str(uuid.uuid4())
        dept_ids.append(did)
        await db["departments"].insert_one({
            "id": did,
            "name": dept_name,
            "description": f"{dept_name} Department",
            "created_at": datetime.datetime.utcnow().isoformat()
        })
        
    # Generate Designations
    print("Generating Designations...")
    desig_ids = []
    for did in dept_ids:
        for title in TITLES:
            desig_id = str(uuid.uuid4())
            desig_ids.append(desig_id)
            await db["designations"].insert_one({
                "id": desig_id,
                "name": f"{title} Engineer" if "Engineering" in DEPARTMENTS[dept_ids.index(did)] else f"{title} Specialist",
                "department_id": did,
                "created_at": datetime.datetime.utcnow().isoformat()
            })

    # Generate 10,000 Seats
    print("Generating 10,000 Seats (This may take a moment)...")
    seats = []
    buildings = ["HQ-A", "HQ-B", "HQ-C"]
    floors = [1, 2, 3, 4, 5]
    zones = ["North", "South", "East", "West"]
    
    for i in range(10000):
        seats.append({
            "id": str(uuid.uuid4()),
            "name": f"Seat-{i+1}",
            "building_id": random.choice(buildings),
            "floor_id": str(random.choice(floors)),
            "zone_id": random.choice(zones),
            "status": "available",
            "attributes": ["window", "standing_desk"] if random.random() > 0.8 else [],
            "created_at": datetime.datetime.utcnow().isoformat()
        })
        
    # Insert seats in batches
    for i in range(0, 10000, 1000):
        await db["seats"].insert_many(seats[i:i+1000])

    # Generate 150 Projects
    print("Generating 150 Projects...")
    projects = []
    project_ids = []
    for i in range(150):
        pid = str(uuid.uuid4())
        project_ids.append(pid)
        projects.append({
            "id": pid,
            "name": f"Project Alpha {i+1}",
            "description": "Enterprise Initiative",
            "status": random.choice(["active", "planning", "completed"]),
            "department_id": random.choice(dept_ids),
            "start_date": datetime.datetime.utcnow().isoformat(),
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    await db["projects"].insert_many(projects)

    # Generate 500 Employees
    print("Generating 500 Employees & Allocating Seats...")
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
    
    employees = []
    allocations = []
    
    # Pick 500 random seats for the employees
    available_seats = list(seats)
    random.shuffle(available_seats)
    assigned_seats = available_seats[:500]
    
    for i in range(500):
        eid = str(uuid.uuid4())
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        dept_id = random.choice(dept_ids)
        desig_id = random.choice(desig_ids)
        
        # Determine if new joiner
        is_new_joiner = random.random() < 0.1
        status = "onboarding" if is_new_joiner else "active"
        
        # Assign to 1-3 random projects
        emp_projects = random.sample(project_ids, random.randint(1, 3))
        
        employees.append({
            "id": eid,
            "first_name": fname,
            "last_name": lname,
            "email": f"{fname.lower()}.{lname.lower()}{i}@smartseat.ai",
            "department_id": dept_id,
            "designation_id": desig_id,
            "project_ids": emp_projects,
            "status": status,
            "joined_at": datetime.datetime.utcnow().isoformat(),
            "created_at": datetime.datetime.utcnow().isoformat()
        })
        
        # Allocate a seat
        seat = assigned_seats[i]
        allocations.append({
            "id": str(uuid.uuid4()),
            "employee_id": eid,
            "seat_id": seat["id"],
            "status": "active",
            "start_date": datetime.datetime.utcnow().isoformat()
        })
        
        # Mark seat as occupied
        await db["seats"].update_one({"id": seat["id"]}, {"$set": {"status": "occupied"}})

    await db["employees"].insert_many(employees)
    await db["allocations"].insert_many(allocations)
    
    print("Enterprise Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed())
