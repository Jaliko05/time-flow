package config

import (
	"fmt"
	"log"
	"os"

	"github.com/jaliko05/time-flow/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ConnectDatabase initializes database connection and runs migrations
func ConnectDatabase() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// Auto migrate schemas
	if err := DB.AutoMigrate(
		&models.Area{},
		&models.User{},
		&models.Project{},
		&models.Activity{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migrations completed")

	// Create default super admin if not exists
	createDefaultSuperAdmin()
}

// createDefaultSuperAdmin creates a default super admin user
func createDefaultSuperAdmin() {
	var count int64
	DB.Model(&models.User{}).Where("role = ?", models.RoleSuperAdmin).Count(&count)

	if count == 0 {
		superAdmin := models.User{
			Email:    "admin@timeflow.com",
			Password: "admin123", // Will be hashed by BeforeCreate hook
			FullName: "Super Administrator",
			Role:     models.RoleSuperAdmin,
			IsActive: true,
		}

		if err := DB.Create(&superAdmin).Error; err != nil {
			log.Printf("Warning: Failed to create default super admin: %v", err)
		} else {
			log.Println("Default super admin created: admin@timeflow.com / admin123")
		}
	}
}
