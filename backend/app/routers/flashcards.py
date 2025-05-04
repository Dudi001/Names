# backend/app/routers/name.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Row
from app.config.database import get_db
from app.config.responses import create_http_response, Http200
from app.packages.card import FlashcardManager
from app.models.name import Name
from app.schema.cards import (InitializeLearningRequest, ReviewCardRequest)
from typing import Any, Sequence, Optional
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


worker = APIRouter()


@worker.post("/initialize", status_code=201)
async def initialize_learning(
    request: InitializeLearningRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Инициализирует карточки для изучения пользователем
    """
    try:
        manager = FlashcardManager(db)
        await manager.initialize_learning_for_user(request.user_id, request.mode)
        print("Initialization successful")
        return {"status": "success", "message": "Learning initialized"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.get("/due")
async def get_due_cards(
    user_id: int,
    mode: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает карточки, которые нужно повторить сегодня
    """
    try:
        manager = FlashcardManager(db)
        cards = await manager.get_due_cards(user_id, mode, limit)
        return jsonable_encoder(cards)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.post("/review")
async def review_card(
    request: ReviewCardRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Сохраняет результат повторения карточки
    """
    try:
        manager = FlashcardManager(db)
        await manager.review_card(request.user_id, request.name_id, request.mode, request.quality)
        return {"status": "success", "message": "Review saved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@worker.get("/stats")
async def get_learning_stats(
    user_id: int,
    mode: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Возвращает статистику изучения
    """
    try:
        manager = FlashcardManager(db)
        stats = await manager.get_learning_stats(user_id, mode)
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
