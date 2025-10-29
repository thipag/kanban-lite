import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import get_settings
from app.db.session import escaped_runtime_database_url


def migration_config() -> Config:
    base_path = Path(__file__).resolve().parents[2]
    config = Config(str(base_path / "alembic.ini"))
    config.set_main_option("script_location", str(base_path / "alembic"))
    config.set_main_option("sqlalchemy.url", escaped_runtime_database_url())
    return config


def run_migrations() -> None:
    config = migration_config()
    try:
        command.upgrade(config, "head")
    except Exception as exc:
        logging.error("Migration step failed, skipping: %s", exc)
