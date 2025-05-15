from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.security import verify_password
from fastapi.security import OAuth2PasswordRequestForm
from app.schema.user import UserCreate
from app.models.user import UserModel


class UserValidate:
    """Класс для валидации данных пользователя."""
    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_user_email(self, user_in: UserCreate):
        """Проверка пользоватлея в бд по email."""

        result = await self.db.execute(
            select(UserModel).where(UserModel.email == user_in.email)
        )
        user = result.scalars().first()

        if user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Пользователь с таким email уже существует",
            )

    async def check_user_id(
        self,
        user_id: str
    ):
        """Проверка пользователя в бд по user_id."""

        result = await self.db.execute(
            select(UserModel)
            .where(UserModel.user_id == int(user_id))
        )
        user = result.scalars().first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Не удалось проверить учетные данные",
            )

        return user

    async def validate_password(
        self,
        form_data: OAuth2PasswordRequestForm
    ):
        """Проверка корректности логина и пароля пользователя."""

        result = await self.db.execute(
            select(UserModel).where(UserModel.username == form_data.username)
        )
        user = result.scalars().first()

        if not user or not verify_password(
            form_data.password,
            user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль",
            )

        return user
