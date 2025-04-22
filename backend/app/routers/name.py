# backend/app/routers/name.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Row
from app.config.database import get_db
from app.config.responses import create_http_response, Http200
from app.models.name import Name
from app.schema.name import NameTestSchema
from typing import Any, Sequence
from fastapi.encoders import jsonable_encoder

worker = APIRouter()


@worker.get("/names", response_model=list[NameTestSchema])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Name).limit(10))
    # users = result.scalars().all()
    rows: Sequence[Row[tuple]] = result.all()
    result: list[dict[str, Any]] = [row._asdict() for row in rows]
    return create_http_response(Http200(jsonable_encoder(result)))


@worker.get("/test", response_model=list[NameTestSchema])
async def test(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Name).limit(1))
    return {"ok": True, "row": result.first()}
