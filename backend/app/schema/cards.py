from pydantic import BaseModel


class InitializeLearningRequest(BaseModel):
    user_id: int
    mode: str


class ReviewCardRequest(BaseModel):
    user_id: int
    name_id: int
    mode: str
    quality: int