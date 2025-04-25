# backend/app/model/name.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Name(Base):
    """Таблица name_ru.names_test"""

    __tablename__ = "names"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_ar: Mapped[str] = mapped_column(String(50))
    transliteration: Mapped[str] = mapped_column(String(100))
    name_ru: Mapped[str] = mapped_column(String(100))
    tafsir: Mapped[str] = mapped_column(String())
