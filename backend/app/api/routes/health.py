from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/health")
def read_health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/version")
def read_version() -> dict[str, str]:
    settings = get_settings()
    return {"version": settings.version}
