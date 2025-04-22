from pydantic import BaseModel


class NameTestSchema(BaseModel):
    id: int
    name_ar: str
    transliteration: str
    name_ru: str
    tafsir: str

    class Config:
        orm_mode = True
