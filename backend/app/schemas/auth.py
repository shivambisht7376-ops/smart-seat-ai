from typing import Optional, Dict, Any
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[Dict[str, Any]] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class CurrentUserOut(BaseModel):
    id: str
    email: str
    role: Dict[str, Any]
    is_active: bool
    created_at: Optional[str] = None
    role_id: Optional[int] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class CurrentUserOut(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool

class RefreshRequest(BaseModel):
    refresh_token: str
