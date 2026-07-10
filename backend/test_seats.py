import asyncio
from google.cloud.firestore_v1.async_client import AsyncClient

async def main():
    db = AsyncClient()
    docs = await db.collection("seats").where("status", "==", "available").limit(5).get()
    print([d.to_dict() for d in docs])

if __name__ == "__main__":
    asyncio.run(main())
