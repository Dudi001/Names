from pydantic import BaseModel


class InitializeLearningRequest(BaseModel):
    """Поля для инициализации карточек"""
    mode: str


class ReviewCardRequest(BaseModel):
    """Поля для проверки карточек"""
    name_id: int
    mode: str
    quality: int
