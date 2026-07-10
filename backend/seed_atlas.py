import asyncio
import uuid
import datetime
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_users():
    uri = os.environ.get("MONGODB_URI", "mongodb+srv://shivam-1:IHToj8Cvr745THtu@test.kqcdkgf.mongodb.net/smartseat?retryWrites=true&w=majority&appName=SmartSeat")
    print(f"Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
    db = client["smartseat"]
    
    users = [
        {"email": "admin@smartseat.ai",    "password": "Admin@123",  "role": "super_admin"},
        {"email": "hr@smartseat.ai",       "password": "Hr@123456",  "role": "hr_admin"},
        {"email": "pm@smartseat.ai",       "password": "Pm@123456",  "role": "project_manager"},
        {"email": "employee@smartseat.ai", "password": "Emp@123456", "role": "employee"},
    ]
    
    users_coll = db["users"]
    
    print("Seeding demo accounts...")
    for u in users:
        existing = await users_coll.find_one({"email": u["email"]})
        if not existing:
            uid = str(uuid.uuid4())
            await users_coll.insert_one({
                "id": uid,
                "email": u["email"],
                "hashed_password": pwd_ctx.hash(u["password"]),
                "role": u["role"],
                "is_active": True,
                "refresh_token_hash": None,
                "last_login": None,
                "created_at": datetime.datetime.utcnow().isoformat(),
                "updated_at": datetime.datetime.utcnow().isoformat(),
            })
            print(f"Created {u['email']}")
        else:
            print(f"User {u['email']} already exists")
            
    print("Done seeding users.")

if __name__ == "__main__":
    asyncio.run(seed_users())
