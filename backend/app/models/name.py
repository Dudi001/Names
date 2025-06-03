from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Name(Base):
    """Таблица name_ru.names_test"""

    __tablename__ = "names"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_ar: Mapped[str] = mapped_column(String(50))
    transliteration: Mapped[str] = mapped_column(String(100))
    name_ru: Mapped[str] = mapped_column(String(100))
    tafsir: Mapped[str] = mapped_column(String())

    progress_records: Mapped[list["LearningProgress"]] = relationship(
        back_populates="name",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Name(id={self.id}, transliteration={self.transliteration})>"
