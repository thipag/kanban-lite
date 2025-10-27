SHELL := /bin/bash

.PHONY: setup dev test lint seed build

PYTHON_CMD := $(if $(wildcard .venv/bin/python),$(abspath .venv/bin/python),python3)
PYTEST_CMD := $(if $(wildcard .venv/bin/pytest),$(abspath .venv/bin/pytest),pytest)
RUFF_CMD := $(if $(wildcard .venv/bin/ruff),$(abspath .venv/bin/ruff),ruff)

setup:
	@if command -v uv >/dev/null 2>&1; then \
		uv venv .venv; \
		uv pip install --python .venv/bin/python -e './backend[dev]'; \
	else \
		python3 -m venv .venv; \
		.venv/bin/pip install --upgrade pip; \
		.venv/bin/pip install -e './backend[dev]'; \
	fi
	cd web && npm install

dev:
	docker compose up --build

test:
	cd backend && $(PYTHON_CMD) -m pytest
	cd web && npm run test

lint:
	cd backend && $(RUFF_CMD) check .
	cd web && npm run lint

seed:
	@if command -v uv >/dev/null 2>&1; then \
		uv run --python .venv/bin/python backend/scripts/seed.py; \
	else \
		$(PYTHON_CMD) backend/scripts/seed.py; \
	fi

build:
	docker build -t kanban-lite-api ./backend
	docker build -t kanban-lite-web ./web
