package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	_ "github.com/jaliko05/time-flow/docs" // swagger docs
	"github.com/jaliko05/time-flow/routes"
	"github.com/joho/godotenv"
)

// @title Time Flow API
// @version 1.0
// @description API para gestión de tiempo y actividades con roles y áreas
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@timeflow.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize database
	config.ConnectDatabase()

	// Setup Gin router
	gin.SetMode(os.Getenv("GIN_MODE"))
	router := gin.Default()

	// Setup routes
	routes.SetupRoutes(router)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
