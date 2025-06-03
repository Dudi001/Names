from pydantic import BaseModel


class InitializeLearningRequest(BaseModel):
    """Поля для инициализации карточек"""
    user_id: int
    mode: str


class ReviewCardRequest(BaseModel):
    """Поля для проверки карточек"""
    user_id: int
    name_id: int
    mode: str
    quality: int
