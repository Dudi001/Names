from fastapi import APIRouter, Depends, status
from app.packages.user.dependencies import get_current_user
from app.models.user import UserModel
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm
from app.config.database import get_db
from app.schema.token import Token
from app.schema.user import UserCreate
from app.config.auth import create_access_token
from app.packages.user.user import User
from app.packages.user.validator import UserValidate


worker = APIRouter()


@worker.post('/registration', status_code=status.HTTP_201_CREATED)
async def registration(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация пользователя."""

    await UserValidate(db).check_user_email(user_in)
    new_user = await User(db).add_new_user(user_in)

    return {
        "message": "Пользователь успешно зарегистрирован",
        "user_id": new_user.user_id
    }


@worker.post('/login', response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Аутентификация пользователя."""

    user = await UserValidate(db).validate_password(form_data)
    token = create_access_token({"sub": str(user.user_id)})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@worker.get("/me")
async def read_profile(
    current_user: UserModel = Depends(get_current_user)
):
    """Воозвращает информацию по зарегестрированному пользователю."""

    return {
        "email": current_user.email,
        "id": current_user.user_id
    }
