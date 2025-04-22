# backend/app/routers/ping.py
from fastapi import APIRouter
from fastapi.responses import JSONResponse


worker = APIRouter()


@worker.get("/ping")
async def ping():
    return JSONResponse({"response": {"ping": "pong"}}, 200)
