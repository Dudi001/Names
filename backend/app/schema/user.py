from pydantic import BaseModel, Field, root_validator, validator
from typing import Optional
from fastapi.exceptions import HTTPException


class UserCreate(BaseModel):
    username: str
    password_hash: str = Field(..., min_length=5)
    first_name: str
    last_name: Optional[str]
    email: str

    @root_validator(pre=True)
    def pre_validator(cls, values):
        keys = values.keys()
        if "username" not in keys or not values.get("username"):
            raise HTTPException(
                400, "Отсутствуют логин пользователя"
            )

        if "first_name" not in keys or values["first_name"] is None:
            raise HTTPException(
                400, "Отсутствуют имя пользователя"
            )

        if "email" not in keys or values["email"] is None:
            raise HTTPException(
                400, "Отсутствуют email пользователя"
            )

        return values

    @validator("password_hash", pre=True)
    def id_validator(cls, value):
        try:
            value >= 5
        except (ValueError, TypeError):
            raise HTTPException(400, "Пароль должен быть боле 5 символов")
        return value

