from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

def runtime_database_url() -> str:
    settings = get_settings()
    url = make_url(settings.database_url)
    if url.host and url.host.lower() == "localhost":
        url = url.set(host="127.0.0.1")
    return url.render_as_string(hide_password=False)


engine = create_engine(runtime_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
