# backend/app/main.py
from fastapi import FastAPI
from app.routers import (
    ping,
    name,
    flashcards,
    user,
    login,
    registration
)
from fastapi.middleware.cors import CORSMiddleware

API_VERSION = '1'


def create_app() -> FastAPI:
    app = FastAPI(
        redoc_url=None,
        debug=True,
        title="Names",
        version=API_VERSION,
        contact={"Murad Manapov": "murad.manapov.96@gmail.com"},
        dependencies=[]
    )

    app.include_router(ping.worker, prefix=f'/v{API_VERSION}/names', tags=["ping"])
    app.include_router(name.worker, prefix=f'/v{API_VERSION}/names', tags=["names"])
    app.include_router(flashcards.worker, prefix=f'/v{API_VERSION}/flashcards', tags=["flashcards"])
    app.include_router(login.worker, prefix=f'/v{API_VERSION}/user', tags=["login"])
    app.include_router(user.worker, prefix=f'/v{API_VERSION}/user', tags=["me"])
    app.include_router(registration.worker, prefix=f'/v{API_VERSION}/user', tags=["reg"])

    return app


app = create_app()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
