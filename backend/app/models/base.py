# backend/app/model/base.py
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

SCHEMA = "name_ru"


class Base(DeclarativeBase):
    metadata = MetaData(schema=SCHEMA)
