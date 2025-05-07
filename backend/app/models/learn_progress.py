# backend/app/models/learn_progress.py
from datetime import date
from sqlalchemy import ForeignKey, Integer, SmallInteger, Float, String, Date, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class LearningProgress(Base):
    """Таблица name_ru.learning_progress"""

    __tablename__ = "learning_progress"
    __table_args__ = (
        # Ограничение на допустимые значения mode
        CheckConstraint(
            """mode IN (
            'transcription_to_translation',
            'arabic_to_translation',
            'translation_to_arabic',
            'translation_to_transcription'
            )""",
            name="check_learning_mode"
        ),
        UniqueConstraint("user_id", "name_id", "mode", name="uq_user_name_mode"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name_id: Mapped[int] = mapped_column(ForeignKey("names.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    mode: Mapped[str] = mapped_column(String(30), nullable=False)
    easiness: Mapped[float] = mapped_column(Float(), nullable=False, default=2.5)
    interval: Mapped[int] = mapped_column(SmallInteger(), default=1)  # SmallInteger достаточно
    repetitions: Mapped[int] = mapped_column(SmallInteger(), default=0)  # SmallInteger достаточно
    last_reviewed: Mapped[date | None] = mapped_column(Date())
    due_date: Mapped[date] = mapped_column(Date(), nullable=False)

    # Опциональные отношения (если нужны)
    name: Mapped["Name"] = relationship(back_populates="progress_records")
    user: Mapped["User"] = relationship(back_populates="learning_progress")

    def __repr__(self):
        return f"<LearningProgress(user_id={self.user_id}, name_id={self.name_id}, mode={self.mode})>"
