from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.auth import get_auth_data
from app.config.database import get_db
from app.models.user import UserModel
from app.packages.user.validator import UserValidate


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserModel:
    """Возвращает текущего пользователя."""

    auth_data = get_auth_data()

    try:
        payload = jwt.decode(
            token,
            auth_data["secret_key"],
            algorithms=[auth_data["algorithm"]]
        )
        user_id: str = payload.get("sub")

        if user_id is None:
            HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Не удалось проверить учетные данные",
            )
    except JWTError:
        HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось проверить учетные данные",
        )

    user = await UserValidate(db).check_user_id(user_id)

    return user
