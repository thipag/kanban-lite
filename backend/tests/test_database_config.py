from configparser import ConfigParser, InterpolationSyntaxError

import pytest

from app.core.config import get_settings
from app.core.migrate import migration_config
from app.db.session import escaped_runtime_database_url, runtime_database_url


def test_runtime_database_url_preserves_percent_sequences(monkeypatch):
    raw_url = "postgresql+psycopg://user_test:Ab12%21%40%23xyz@127.0.0.1:5432/testdb"
    monkeypatch.setenv("DATABASE_URL", raw_url)
    get_settings.cache_clear()

    rendered = runtime_database_url()

    assert rendered == raw_url

    get_settings.cache_clear()


def test_escaped_runtime_database_url_is_configparser_safe(monkeypatch):
    raw_url = "postgresql+psycopg://user_test:Ab12%21%40%23xyz@127.0.0.1:5432/testdb"
    monkeypatch.setenv("DATABASE_URL", raw_url)
    get_settings.cache_clear()

    parser = ConfigParser()
    parser.read_string(f"[alembic]\nsqlalchemy.url = {raw_url}\n")
    with pytest.raises(InterpolationSyntaxError):
        parser.get("alembic", "sqlalchemy.url")

    parser = ConfigParser()
    parser.read_string(f"[alembic]\nsqlalchemy.url = {escaped_runtime_database_url()}\n")
    assert parser.get("alembic", "sqlalchemy.url") == raw_url

    get_settings.cache_clear()
