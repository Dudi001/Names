from datetime import datetime, timedelta, timezone
from jose import jwt
from app.config.config import get_auth_data


def create_access_token(
        data: dict,
        expires_delta: timedelta = timedelta(days=30)
) -> str:
    """Создает токен для пользователя."""

    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    auth_data = get_auth_data()

    return jwt.encode(
        to_encode, auth_data["secret_key"],
        algorithm=auth_data["algorithm"]
    )
