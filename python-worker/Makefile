.PHONY: help build run test clean logs shell health pause resume dlq

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker image
	docker build -t collabryx-embedding-service .

build-no-cache: ## Build Docker image without cache
	docker build --no-cache -t collabryx-embedding-service .

run: ## Run container locally
	docker-compose up -d

stop: ## Stop container
	docker-compose down

restart: ## Restart container
	docker-compose restart

logs: ## View container logs
	docker-compose logs -f

logs-error: ## View only error logs
	docker-compose logs 2>&1 | grep -i error

shell: ## Shell into running container
	docker-compose exec embedding-service bash

test: ## Run tests
	docker-compose exec embedding-service pytest

test-cov: ## Run tests with coverage report
	docker-compose exec embedding-service pytest --cov=. --cov-report=html

test-watch: ## Run tests in watch mode
	docker-compose exec embedding-service pytest -w

health: ## Check service health
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health | python -m json.tool

pause: ## Pause queue processing
	@echo "Pausing queue..."
	@curl -X POST http://localhost:8000/queue/pause

resume: ## Resume queue processing
	@echo "Resuming queue..."
	@curl -X POST http://localhost:8000/queue/resume

queue-status: ## Get queue status
	@echo "Queue status:"
	@curl -s http://localhost:8000/queue/status | python -m json.tool

dlq: ## View dead letter queue
	@echo "Dead Letter Queue:"
	@curl -s http://localhost:8000/queue/dlq | python -m json.tool

dlq-retry: ## Retry all DLQ messages
	@echo "Retrying DLQ messages..."
	@curl -X POST http://localhost:8000/queue/dlq/retry

clean: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f

size: ## Show image size
	docker images | grep collabryx-embedding-service

dev: ## Run in development mode with hot reload
	docker-compose up -d --build
	docker-compose exec embedding-service pip install -e .

prod: ## Run in production mode
	docker-compose -f docker-compose.yml up -d --build

metrics: ## Get service metrics
	@echo "Service Metrics:"
	@curl -s http://localhost:8000/ | python -m json.tool
	@echo ""
	@curl -s http://localhost:8000/model-info | python -m json.tool
