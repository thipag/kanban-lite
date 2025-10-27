from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    app_name: str = "kanban-lite"
    version: str = "0.1.0"
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/kanban"
    frontend_origin: str = "http://localhost:5173"
    additional_origins: str | None = None
    auto_migrate: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="allow")


@lru_cache
def get_settings() -> Settings:
    return Settings()
