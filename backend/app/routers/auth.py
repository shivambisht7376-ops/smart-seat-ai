"""
SmartSeat AI — Auth Router (Firebase)
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import CurrentUser, get_client_ip, get_user_agent
from app.schemas.auth import (
    ChangePasswordRequest, CurrentUserOut, LoginRequest,
    RefreshRequest, TokenResponse,
)
from app.services.auth_service import AuthError, AuthService

router = APIRouter()


def _auth_service(db: Annotated[AsyncClient, Depends(get_db)]) -> AuthService:
    return AuthService(db)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    body: LoginRequest,
    request: Request,
    service: Annotated[AuthService, Depends(_auth_service)],
):
    try:
        return await service.login(
            email=body.email,
            password=body.password,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        import traceback
        print(f"[LOGIN ERROR] {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {type(e).__name__}: {str(e)}")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    service: Annotated[AuthService, Depends(_auth_service)],
):
    try:
        return await service.refresh(body.refresh_token)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(_auth_service)],
):
    await service.logout(user_id=current_user.id)


@router.get("/me")
async def get_me(
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(_auth_service)],
):
    try:
        return await service.get_me(current_user.id)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    current_user: CurrentUser,
    service: Annotated[AuthService, Depends(_auth_service)],
):
    try:
        await service.change_password(
            user_id=current_user.id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
