from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.user import User
from app.schema.user import UserCreate
from app.config.security import get_password_hash


worker = APIRouter()


@worker.post('/registration', status_code=status.HTTP_201_CREATED)
async def login(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация пользователей"""
    result = await db.execute(
        select(User).where(User.email == user_in.email)
    )
    user = result.scalars().first()

    if user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь с таким email уже существует",
        )

    new_user = User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password_hash),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "message": "Пользователь успешно зарегистрирован",
        "user_id": new_user.user_id
    }
