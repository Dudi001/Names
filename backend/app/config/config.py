from pydantic import BaseSettings


class Settings(BaseSettings):
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    secret_key: str
    algorithm: str

    class Config:
        env_file = '.env'


settings = Settings()


def get_auth_data():
    return {"secret_key": settings.secret_key, "algorithm": settings.algorithm}
