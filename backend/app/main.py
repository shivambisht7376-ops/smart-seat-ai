"""
SmartSeat AI — FastAPI Application Entry Point (In-Memory)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import settings

from app.routers import auth, analytics, ai_query
from app.routers.employees import router as employees_router, dept_router, desig_router
from app.routers import projects
from app.routers.seats import router as seats_router, bldg_router, floor_router, zone_router
from app.routers.allocations import router as alloc_router, nj_router
from app.routers import audit

limiter = Limiter(key_func=get_remote_address)

from app.database import get_mongodb

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"   Environment : {settings.ENVIRONMENT}")
    print(f"   Database    : In-Memory (no external DB required)")
    print(f"   AI Provider : {settings.ai_provider}")
    get_mongodb()  # initialise the in-memory store

    yield
    print("👋 SmartSeat AI shutdown complete")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SmartSeat AI — Enterprise Seat Allocation & Workforce Management (In-Memory)",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

api_prefix = "/api"

app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(employees_router, prefix=f"{api_prefix}/employees", tags=["Employees"])
app.include_router(dept_router, prefix=f"{api_prefix}/departments", tags=["Departments"])
app.include_router(desig_router, prefix=f"{api_prefix}/designations", tags=["Designations"])
app.include_router(projects.router, prefix=f"{api_prefix}/projects", tags=["Projects"])
app.include_router(seats_router, prefix=f"{api_prefix}/seats", tags=["Seats"])
app.include_router(bldg_router, prefix=f"{api_prefix}/buildings", tags=["Buildings"])
app.include_router(floor_router, prefix=f"{api_prefix}/floors", tags=["Floors"])
app.include_router(zone_router, prefix=f"{api_prefix}/zones", tags=["Zones"])
app.include_router(alloc_router, prefix=f"{api_prefix}/allocations", tags=["Seat Allocations"])
app.include_router(nj_router, prefix=f"{api_prefix}/new-joiners", tags=["New Joiners"])
app.include_router(analytics.router, prefix=f"{api_prefix}/analytics", tags=["Analytics"])
app.include_router(audit.router, prefix=f"{api_prefix}/audit", tags=["Audit Logs"])
app.include_router(ai_query.router, prefix=f"{api_prefix}/ai", tags=["AI Query"])