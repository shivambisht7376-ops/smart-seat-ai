"""
Tests for authentication endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@smartseat.ai", "password": "Admin@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@smartseat.ai", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/api/auth/login",
        json={"email": "nobody@smartseat.ai", "password": "Admin@123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, admin_user):
    # Login first
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@smartseat.ai", "password": "Admin@123"},
    )
    access_token = login_resp.json()["access_token"]

    # Get profile
    me_resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@smartseat.ai"


@pytest.mark.asyncio
async def test_me_without_token(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, admin_user):
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@smartseat.ai", "password": "Admin@123"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    refresh_resp = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    new_data = refresh_resp.json()
    assert "access_token" in new_data
    assert new_data["refresh_token"] != refresh_token  # token rotated


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_user):
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@smartseat.ai", "password": "Admin@123"},
    )
    access_token = login_resp.json()["access_token"]

    logout_resp = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_resp.status_code == 204


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
