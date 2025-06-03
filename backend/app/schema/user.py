from pydantic import BaseModel, Field, root_validator, EmailStr
from typing import Optional
from fastapi.exceptions import HTTPException


class UserCreate(BaseModel):
    username: str
    password_hash: str = Field(..., min_length=5)
    first_name: str
    last_name: Optional[str]
    email: EmailStr = Field(..., description="User email")

    @root_validator(pre=True)
    def pre_validator(cls, values):
        keys = values.keys()
        if "username" not in keys or not values.get("username"):
            raise HTTPException(
                400,
                "Отсутствует логин пользователя"
            )

        if "first_name" not in keys or not values.get("first_name"):
            raise HTTPException(
                400,
                "Отсутствуют имя пользователя"
            )

        if "email" not in keys or not values.get("email"):
            raise HTTPException(
                400,
                "Отсутствуют email пользователя"
            )

        return values
