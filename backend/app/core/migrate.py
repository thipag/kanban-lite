import time
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.exc import OperationalError

from app.core.config import get_settings
from app.db.session import runtime_database_url


def migration_config() -> Config:
    base_path = Path(__file__).resolve().parents[2]
    config = Config(str(base_path / "alembic.ini"))
    config.set_main_option("script_location", str(base_path / "alembic"))
    config.set_main_option("sqlalchemy.url", runtime_database_url())
    return config


def run_migrations() -> None:
    config = migration_config()
    attempts = 0
    while True:
        try:
            command.upgrade(config, "head")
            break
        except OperationalError as exc:
            attempts += 1
            if attempts >= 5:
                raise exc
            time.sleep(2)
