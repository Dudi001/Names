from sqlalchemy.ext.asyncio import AsyncSession
from app.schema.user import UserCreate
from app.models.user import UserModel
from app.config.security import get_password_hash


class User:
    """Класс для работы с методами пользователя"""
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_new_user(
        self,
        user: UserCreate
    ) -> UserModel:
        """Метод для добавления нового пользователя в бд."""

        new_user = UserModel(
            username=user.username,
            password_hash=get_password_hash(user.password_hash),
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email
        )

        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)

        return new_user
