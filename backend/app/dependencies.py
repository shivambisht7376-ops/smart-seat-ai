"""
SmartSeat AI — FastAPI Dependencies (Firestore)
JWT validation, current user injection, RBAC guards.
"""
from typing import Annotated, Optional
from google.cloud.firestore import AsyncClient
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.database import get_db
from app.utils.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUserData:
    def __init__(self, data: dict):
        self.id = data.get("id")
        self.email = data.get("email")
        self.role = data.get("role")
        self.is_active = data.get("is_active", True)
        self._data = data

    def __getattr__(self, item):
        return self._data.get(item)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
    db: AsyncClient = Depends(get_db)
) -> CurrentUserData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise credentials_exception
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    doc = await db.collection("users").document(user_id).get()
    if not doc.exists:
        raise credentials_exception

    user_data = {"id": doc.id, **doc.to_dict()}
    if not user_data.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return CurrentUserData(user_data)


CurrentUser = Annotated[CurrentUserData, Depends(get_current_user)]


def require_roles(*allowed_roles: str):
    async def _guard(current_user: CurrentUser) -> CurrentUserData:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}")
        return current_user
    return _guard


RequireSuperAdmin     = Depends(require_roles("super_admin"))
RequireHRAdmin        = Depends(require_roles("super_admin", "hr_admin"))
RequireProjectManager = Depends(require_roles("super_admin", "hr_admin", "project_manager"))
RequireAnyStaff       = Depends(require_roles("super_admin", "hr_admin", "project_manager", "employee"))


def get_client_ip(request: Request) -> Optional[str]:
    ff = request.headers.get("X-Forwarded-For")
    return ff.split(",")[0].strip() if ff else (request.client.host if request.client else None)


def get_user_agent(request: Request) -> Optional[str]:
    return request.headers.get("User-Agent")