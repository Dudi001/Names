from pydantic import BaseModel


class Names(BaseModel):
    """Поля для имен"""
    id: int
    name_ar: str
    transliteration: str
    name_ru: str
    tafsir: str

    class Config:
        orm_mode = True
