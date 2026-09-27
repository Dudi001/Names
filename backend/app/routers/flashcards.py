from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.models.user import UserModel
from app.packages.card.card import FlashcardManager
from app.packages.user.dependencies import get_current_user
from app.schema.cards import (InitializeLearningRequest, ReviewCardRequest)
from typing import Optional
from fastapi.encoders import jsonable_encoder


worker = APIRouter()


@worker.post("/initialize", status_code=201)
async def initialize_learning(
    request: InitializeLearningRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Инициализирует карточки для изучения пользователем
    """
    try:
        manager = FlashcardManager(db)
        await manager.initialize_learning_for_user(
            current_user.user_id,
            request.mode
        )
        return {"status": "success", "message": "Learning initialized"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.get("/due")
async def get_due_cards(
    mode: str,
    limit: int = 20,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает карточки, которые нужно повторить сегодня
    """
    try:
        manager = FlashcardManager(db)
        cards = await manager.get_due_cards(current_user.user_id, mode, limit)
        return jsonable_encoder(cards)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.post("/review")
async def review_card(
    request: ReviewCardRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Сохраняет результат повторения карточки
    """
    try:
        manager = FlashcardManager(db)
        await manager.review_card(
            current_user.user_id,
            request.name_id,
            request.mode,
            request.quality
        )
        return {"status": "success", "message": "Review saved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.get("/stats")
async def get_learning_stats(
    mode: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает статистику изучения
    """
    try:
        manager = FlashcardManager(db)
        stats = await manager.get_learning_stats(current_user.user_id, mode)
        return jsonable_encoder(stats)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.get("/modes")
async def get_learning_modes():
    """
    Возвращает доступные режимы изучения
    """
    try:
        modes = FlashcardManager.get_mode_options()
        return jsonable_encoder(modes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
