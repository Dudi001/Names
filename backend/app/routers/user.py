from fastapi import APIRouter, Depends
from app.packages.user.dependencies import get_current_user
from app.models.user import User


worker = APIRouter()


@worker.get("/me")
async def read_profile(
    current_user: User = Depends(get_current_user)
):
    """Воозвращает информацию по зарегестрированному пользователю"""
    return {
        "email": current_user.email,
        "id": current_user.user_id
    }
