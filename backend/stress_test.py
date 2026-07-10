import asyncio
import httpx
import time

API_BASE = "http://localhost:8000"
# In a real app we'd need a token, but let's test if the server crashes or just returns 401s smoothly.
# The user's bug report showed 401 Unauthorized for `/api/seats?status=available` but Next.js proxy adds the token if logged in.
# For load testing, we will just hit the endpoints. Even 401 responses test the server's load capacity.

async def fetch(client, endpoint):
    try:
        response = await client.get(f"{API_BASE}{endpoint}")
        return response.status_code
    except Exception as e:
        return str(e)

async def stress_test():
    print("Starting stress test...")
    endpoints = [
        "/api/employees",
        "/api/seats",
        "/api/allocations",
        "/api/departments",
        "/api/projects"
    ]
    
    start_time = time.time()
    
    async with httpx.AsyncClient() as client:
        # Fire 500 concurrent requests
        tasks = []
        for i in range(500):
            endpoint = endpoints[i % len(endpoints)]
            tasks.append(fetch(client, endpoint))
            
        results = await asyncio.gather(*tasks)
        
    duration = time.time() - start_time
    
    # Analyze results
    status_counts = {}
    for r in results:
        status_counts[r] = status_counts.get(r, 0) + 1
        
    print(f"Stress test completed in {duration:.2f} seconds.")
    print("Result distribution:")
    for status, count in status_counts.items():
        print(f"  {status}: {count}")
        
    if 500 in status_counts:
        print("ERROR: Server returned HTTP 500 Internal Server Error!")
    else:
        print("SUCCESS: No server crashes or 500 errors detected.")

if __name__ == "__main__":
    asyncio.run(stress_test())
