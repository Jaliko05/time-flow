.PHONY: help install run build test swagger clean

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install Go dependencies
	go mod download
	go mod tidy
	go install github.com/swaggo/swag/cmd/swag@latest

swagger: ## Generate Swagger documentation
	swag init -g main.go -o ./docs

run: ## Run the application
	go run main.go

build: ## Build the application
	go build -o bin/timeflow main.go

dev: swagger run ## Generate docs and run in development mode

test: ## Run tests
	go test -v ./...

clean: ## Clean build artifacts
	rm -rf bin/
	rm -rf docs/docs.go docs/swagger.json docs/swagger.yaml

docker-build: ## Build Docker image
	docker build -t timeflow-backend .

docker-run: ## Run Docker container
	docker run -p 8080:8080 --env-file .env timeflow-backend
