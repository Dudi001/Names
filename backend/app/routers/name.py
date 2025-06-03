from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Row
from app.config.database import get_db
from app.config.responses import create_http_response, Http200
from app.models.name import Name
from app.schema.name import Names
from typing import Any, Sequence
from fastapi.encoders import jsonable_encoder


worker = APIRouter()


@worker.get("/names", response_model=list[Names])
async def get_users(
    db: AsyncSession = Depends(get_db)
):
    """Возвращает список имен Всевышнего для отображения на странице"""

    result = await db.execute(select(Name))
    rows: Sequence[Row[tuple]] = result.all()
    result: list[dict[str, Any]] = [row._asdict() for row in rows]
    return create_http_response(Http200(jsonable_encoder(result)))


@worker.get("/test", response_model=list[Names])
async def test(
    db: AsyncSession = Depends(get_db)
):
    """Метод служит для проверки работы бд"""
    result = await db.execute(select(Name).limit(1))
    return {"ok": True, "row": result.first()}
