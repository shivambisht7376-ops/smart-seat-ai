"""
SmartSeat AI — AI Query Router (Firebase)
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from google.cloud.firestore import AsyncClient

from app.database import get_db
from app.dependencies import CurrentUser, RequireAnyStaff
from app.services.ai_service import AIService

router = APIRouter()


def _svc(db: Annotated[AsyncClient, Depends(get_db)]) -> AIService:
    return AIService(db)


@router.post("/query", dependencies=[RequireAnyStaff])
async def ai_query(
    payload: dict,
    current_user: CurrentUser,
    svc: Annotated[AIService, Depends(_svc)] = None,
):
    question = payload.get("question", "")
    return await svc.answer(question=question, user_id=current_user.id)
