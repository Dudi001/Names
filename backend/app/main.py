# backend/app/main.py
from fastapi import FastAPI
from app.routers import ping
from app.routers import name


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

    app.include_router(ping.worker, prefix=f'/v{API_VERSION}/ping', tags=["ping"])
    app.include_router(name.worker, prefix=f'/v{API_VERSION}/names', tags=["names"])

    return app

app = create_app()
