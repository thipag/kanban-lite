FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY app ./app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic
COPY scripts ./scripts
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
