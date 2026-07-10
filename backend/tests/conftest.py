"""
Pytest configuration and fixtures for SmartSeat AI tests.
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db
from app.models.user import Role, User
from app.utils.security import hash_password

# Use in-memory SQLite for tests (fast, no external dependency)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    async_session = async_sessionmaker(test_engine, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with DB dependency overridden."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def seed_roles(db_session: AsyncSession):
    """Seed the four default roles."""
    roles = [
        Role(name="super_admin", permissions={"all": True}),
        Role(name="hr_admin", permissions={"employees": ["read", "write"]}),
        Role(name="project_manager", permissions={"projects": ["read", "write"]}),
        Role(name="employee", permissions={"employees": ["read_self"]}),
    ]
    for r in roles:
        db_session.add(r)
    await db_session.commit()
    return {r.name: r for r in roles}


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession, seed_roles):
    """Create a super_admin user."""
    user = User(
        email="admin@smartseat.ai",
        hashed_password=hash_password("Admin@123"),
        role_id=seed_roles["super_admin"].id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
