"""
SmartSeat AI — Auth Service (Firestore)
"""
from datetime import datetime, UTC
from typing import Optional
from google.cloud.firestore import AsyncClient

from app.utils.security import (
    create_access_token, create_refresh_token,
    hash_refresh_token, verify_password,
    verify_refresh_token_hash, decode_refresh_token,
    get_password_hash,
)


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthService:
    def __init__(self, db: AsyncClient):
        self.db = db
        self.users = db.collection("users")

    async def _get_user_by_email(self, email: str) -> Optional[dict]:
        docs = [d async for d in self.users.where("email", "==", email).limit(1).stream()]
        if not docs:
            return None
        return {"id": docs[0].id, **docs[0].to_dict()}

    async def _get_user_by_id(self, user_id: str) -> Optional[dict]:
        doc = await self.users.document(user_id).get()
        if not doc.exists:
            return None
        return {"id": doc.id, **doc.to_dict()}

    async def login(self, email: str, password: str,
                    ip_address: Optional[str] = None,
                    user_agent: Optional[str] = None) -> dict:
        user = await self._get_user_by_email(email)
        if not user:
            raise AuthError("Invalid email or password")
        if not user.get("is_active", True):
            raise AuthError("Account is deactivated. Contact your administrator.", 403)
        if not verify_password(password, user["hashed_password"]):
            raise AuthError("Invalid email or password")

        access_token  = create_access_token(data={"sub": user["id"], "role": user["role"], "email": user["email"]})
        refresh_token = create_refresh_token(data={"sub": user["id"]})

        await self.users.document(user["id"]).update({
            "refresh_token_hash": hash_refresh_token(refresh_token),
            "last_login": datetime.now(UTC).isoformat()
        })
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {"id": user["id"], "email": user["email"], "role": user["role"]},
        }

    async def refresh(self, refresh_token: str) -> dict:
        try:
            payload = decode_refresh_token(refresh_token)
            user_id = payload.get("sub")
        except Exception:
            raise AuthError("Invalid refresh token")

        user = await self._get_user_by_id(user_id)
        if not user:
            raise AuthError("User not found")
        if not verify_refresh_token_hash(refresh_token, user.get("refresh_token_hash") or ""):
            raise AuthError("Refresh token has been revoked")

        new_access  = create_access_token(data={"sub": user_id, "role": user["role"], "email": user["email"]})
        new_refresh = create_refresh_token(data={"sub": user_id})

        await self.users.document(user_id).update({"refresh_token_hash": hash_refresh_token(new_refresh)})
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "user": {"id": user_id, "email": user["email"], "role": user["role"]},
        }

    async def logout(self, user_id: str, **kwargs) -> None:
        await self.users.document(user_id).update({"refresh_token_hash": None})

    async def get_me(self, user_id: str) -> dict:
        user = await self._get_user_by_id(user_id)
        if not user:
            raise AuthError("User not found", 404)

        # Role must be returned as an OBJECT {id, name, permissions}
        # because the frontend checks user.role.name (not user.role)
        role_str = user.get("role", "employee")
        role_obj = {
            "id": 1,
            "name": role_str,
            "permissions": {}
        }

        return {
            "id":         user["id"],
            "email":      user["email"],
            "role":       role_obj,
            "is_active":  user.get("is_active", True),
            "last_login": user.get("last_login"),
            "created_at": user.get("created_at", ""),
            "role_id":    1,
        }

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        user = await self._get_user_by_id(user_id)
        if not user:
            raise AuthError("User not found", 404)
        if not verify_password(current_password, user["hashed_password"]):
            raise AuthError("Current password is incorrect", 400)
        await self.users.document(user_id).update({
            "hashed_password": get_password_hash(new_password),
            "refresh_token_hash": None
        })
