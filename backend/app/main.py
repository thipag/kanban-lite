from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import cards, health
from app.core.config import get_settings
from app.core.migrate import run_migrations

settings = get_settings()

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(cards.router)


@app.on_event("startup")
def startup_event() -> None:
    if settings.auto_migrate:
        run_migrations()
