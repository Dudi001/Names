from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from app.config.database import get_db
from app.models.user import User
from app.schema.token import Token
from app.config.auth import create_access_token
from app.config.security import verify_password


worker = APIRouter()


@worker.post('/login', response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    bd: AsyncSession = Depends(get_db)
):
    """Аутентификация пользователей"""
    result = await bd.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    token = create_access_token({"sub": str(user.user_id)})
    return {"access_token": token, "token_type": "bearer"}
