SHELL := /bin/bash

.PHONY: setup dev test lint seed build build-backend build-frontend package-backend package-frontend packages deploy

-include .env

export $(shell sed -ne 's/^
//;s/[[:space:]]*=.*//p' .env)

PYTHON_CMD := $(if $(wildcard .venv/bin/python),$(abspath .venv/bin/python),python3)
PYTEST_CMD := $(if $(wildcard .venv/bin/pytest),$(abspath .venv/bin/pytest),pytest)
RUFF_CMD := $(if $(wildcard .venv/bin/ruff),$(abspath .venv/bin/ruff),ruff)

REGISTRY ?= localhost:5000
BACKEND_IMAGE_NAME ?= kanban-lite-api
TAG ?= latest
BACKEND_IMAGE := $(REGISTRY)/$(BACKEND_IMAGE_NAME):$(TAG)
TF_ARGS ?= -auto-approve
REGISTRY_USERNAME ?=
REGISTRY_PASSWORD ?=

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

build: build-backend build-frontend

build-backend:
	@if [ -z "$(REGISTRY)" ]; then \
		echo "Set REGISTRY in .env before building the backend image"; \
		exit 1; \
	fi
	docker build -t $(BACKEND_IMAGE) ./backend

build-frontend:
	cd web && npm run build

package-backend: build-backend
ifneq ($(strip $(REGISTRY_USERNAME)$(REGISTRY_PASSWORD)),)
	echo "$(REGISTRY_PASSWORD)" | docker login $(REGISTRY) --username "$(REGISTRY_USERNAME)" --password-stdin
endif
	docker push $(BACKEND_IMAGE)

package-frontend: build-frontend
	@echo "Frontend bundle ready at web/dist"

packages: package-backend package-frontend

deploy: packages
	terraform -chdir=infra apply $(TF_ARGS)
