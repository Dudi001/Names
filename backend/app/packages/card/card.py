# app/packages/card.py
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, case, and_
from sqlalchemy.dialects.postgresql import insert
from app.models.name import Name
from app.models.learn_progress import LearningProgress
from app.models.user import UserModel
from typing import List, Dict, Optional


class FlashcardManager:
    """Класс для работы с методами интервального повторения"""
    def __init__(self, db: AsyncSession):
        """Инициализация менеджера карточек с подключением к БД"""
        self.db = db

    async def initialize_learning_for_user(
            self,
            user_id: int,
            mode: str = 'transcription_to_translation'
    ):
        """
        Инициализирует карточки для изучения пользователем в указанном режиме
        """
        # Проверка валидности режима
        valid_modes = [mode_info['id'] for mode_info in self.get_mode_options()]
        if mode not in valid_modes:
            raise ValueError(f"Неверный режим обучения: {mode}")

        # Получаем все имена
        result = await self.db.execute(select(Name.id))
        name_ids = result.scalars().all()

        today = datetime.date.today()

        # Создаём записи прогресса для каждого имени
        for name_id in name_ids:
            stmt = (
                insert(LearningProgress)
                .values(
                    name_id=name_id,
                    user_id=user_id,
                    mode=mode,
                    easiness=2.5,
                    interval=1,
                    repetitions=0,
                    last_reviewed=today,
                    due_date=today
                )
                .on_conflict_do_nothing(
                    constraint='uq_user_name_mode'
                )
            )
            await self.db.execute(stmt)

        await self.db.commit()

    async def get_due_cards(
            self,
            user_id: int,
            mode: str = 'transcription_to_translation',
            limit: int = 20
    ) -> List[Dict]:
        """
        Возвращает карточки, которые нужно повторить сегодня указанному пользователю
        """
        today = datetime.date.today()

        stmt = (
            select(
                Name.id,
                Name.name_ar,
                Name.transliteration,
                Name.name_ru,
                LearningProgress.easiness,
                LearningProgress.interval,
                LearningProgress.repetitions,
                LearningProgress.due_date
            )
            .join(LearningProgress, Name.id == LearningProgress.name_id)
            .where(
                and_(
                    LearningProgress.user_id == user_id,
                    LearningProgress.mode == mode,
                    LearningProgress.due_date <= today
                )
            )
            .order_by(LearningProgress.due_date, LearningProgress.easiness)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        rows = result.fetchall()

        return [{
            'id': row.id,
            'name_ar': row.name_ar,
            'transcription': row.transliteration,
            'name_ru': row.name_ru,
            'easiness': row.easiness,
            'interval': row.interval,
            'repetitions': row.repetitions,
            'due_date': row.due_date
        } for row in rows]

    async def review_card(
            self,
            user_id: int,
            name_id: int,
            mode: str,
            quality: int
    ):
        """
        Обновляет прогресс изучения карточки после повторения

        Args:
            user_id: ID пользователя
            name_id: ID имени Аллаха
            mode: режим изучения
            quality: оценка от 0 до 5 (5 - отлично, 0 - не знал)
        """
        if not 0 <= quality <= 5:
            raise ValueError(
                f"Оценка должна быть от 0 до 5, получено: {quality}"
            )

        # 1. Получаем текущий прогресс
        stmt = select(LearningProgress).where(
            and_(
                LearningProgress.user_id == user_id,
                LearningProgress.name_id == name_id,
                LearningProgress.mode == mode
            )
        )
        result = await self.db.execute(stmt)
        progress = result.scalar_one_or_none()

        if not progress:
            raise ValueError("Прогресс изучения не найден")

        # 2. Применяем алгоритм SM-2
        if quality < 3:
            new_repetitions = 0
            new_interval = 1
        else:
            if progress.repetitions == 0:
                new_interval = 1
            elif progress.repetitions == 1:
                new_interval = 6
            else:
                new_interval = round(progress.interval * progress.easiness)
            new_repetitions = progress.repetitions + 1

        # 3. Обновляем начальный коэффицент легкости
        if quality >= 3:
            new_easiness = progress.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            new_easiness = max(new_easiness, 1.3)
        else:
            new_easiness = progress.easiness

        # 4. Обновляем даты
        today = datetime.date.today()
        new_due_date = today + datetime.timedelta(days=new_interval)

        # 5. Выполняем UPDATE через SQLAlchemy
        update_stmt = (
            update(LearningProgress)
            .where(
                and_(
                    LearningProgress.user_id == user_id,
                    LearningProgress.name_id == name_id,
                    LearningProgress.mode == mode
                )
            )
            .values(
                easiness=new_easiness,
                interval=new_interval,
                repetitions=new_repetitions,
                last_reviewed=today,
                due_date=new_due_date
            )
        )

        await self.db.execute(update_stmt)
        await self.db.commit()

    async def get_learning_stats(
            self,
            user_id: int,
            mode: Optional[str] = None
    ) -> Dict:
        """
        Возвращает статистику изучения для конкретного пользователя
        """
        today = datetime.date.today()

        stmt = select(
            func.count().label('total'),
            func.sum(
                case(
                    (LearningProgress.interval > 30, 1),
                    else_=0
                )
            ).label('learned'),
            func.sum(
                case(
                    (LearningProgress.due_date <= today, 1),
                    else_=0
                )
            ).label('due_today')
        ).where(LearningProgress.user_id == user_id)

        if mode:
            stmt = stmt.where(LearningProgress.mode == mode)

        result = await self.db.execute(stmt)
        stats = result.fetchone()

        return {
            'total': stats.total or 0,
            'learned': stats.learned or 0,
            'due_today': stats.due_today or 0
        }

    async def get_user_stats(self, user_id: int) -> Dict:
        """
        Возвращает статистику пользователя
        """
        stmt = select(UserModel).where(UserModel.user_id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError("Пользователь не найден")

        return {
            "username": user.username,
            "total_cards": await self._count_user_cards(user_id),
            "learned_cards": await self._count_learned_cards(user_id)
        }

    async def _count_user_cards(self, user_id: int) -> int:
        stmt = select(func.count()).select_from(LearningProgress).where(
            LearningProgress.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_learned_cards(self, user_id: int) -> int:
        stmt = select(func.count()).where(
            and_(
                LearningProgress.user_id == user_id,
                LearningProgress.interval > 30
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    def get_mode_options() -> List[Dict[str, str]]:
        """Возвращает список доступных режимов изучения"""
        return [
            {
                'id': 'transcription_to_translation',
                'description': 'Транскрипция → Перевод'
            },
            {
                'id': 'translation_to_transcription',
                'description': 'Перевод → Транскрипция'
            },
            {
                'id': 'arabic_to_translation',
                'description': 'Арабское написание → Перевод'
            },
            {
                'id': 'translation_to_arabic',
                'description': 'Перевод → Арабское написание'
            }
        ]

    async def close(self):
        """Закрывает соединение с базой данных"""
        await self.db.close()
