package config

import (
	"fmt"
	"log"
	"os"
	"time"

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

	// Configure GORM logger with slow query threshold
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond, // Log queries slower than 200ms
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: newLogger,
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
		&models.Task{},
		&models.Activity{},
		&models.Comment{},
		&models.ProjectAssignment{},
		&models.TaskAssignment{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database schema migrations completed")

	// Run custom migrations (indexes, constraints, etc.)
	runCustomMigrations()

	// Create default super admin if not exists
	createDefaultSuperAdmin()
}

// runCustomMigrations applies custom migrations that AutoMigrate doesn't handle
func runCustomMigrations() {
	log.Println("Running custom migrations...")

	// List of index migrations
	indexMigrations := []struct {
		name      string
		tableName string
		sql       string
	}{
		{
			name:      "idx_users_area_id",
			tableName: "users",
			sql:       "CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id)",
		},
		{
			name:      "idx_users_role",
			tableName: "users",
			sql:       "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
		},
		{
			name:      "idx_projects_area_id",
			tableName: "projects",
			sql:       "CREATE INDEX IF NOT EXISTS idx_projects_area_id ON projects(area_id)",
		},
		{
			name:      "idx_projects_created_by",
			tableName: "projects",
			sql:       "CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by)",
		},
		{
			name:      "idx_projects_assigned_user_id",
			tableName: "projects",
			sql:       "CREATE INDEX IF NOT EXISTS idx_projects_assigned_user_id ON projects(assigned_user_id)",
		},
		{
			name:      "idx_activities_user_id",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)",
		},
		{
			name:      "idx_activities_project_id",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id)",
		},
		{
			name:      "idx_activities_area_id",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_area_id ON activities(area_id)",
		},
		{
			name:      "idx_activities_date",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date)",
		},
		{
			name:      "idx_tasks_project_id",
			tableName: "tasks",
			sql:       "CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)",
		},
		{
			name:      "idx_users_email",
			tableName: "users",
			sql:       "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL",
		},
		{
			name:      "idx_projects_is_active",
			tableName: "projects",
			sql:       "CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active) WHERE deleted_at IS NULL",
		},
		{
			name:      "idx_activities_user_date",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date DESC)",
		},
	}

	// Apply each migration
	successCount := 0
	for _, migration := range indexMigrations {
		if err := DB.Exec(migration.sql).Error; err != nil {
			log.Printf("Warning: Failed to create index %s: %v", migration.name, err)
		} else {
			successCount++
			log.Printf("✓ Index created/verified: %s on %s", migration.name, migration.tableName)
		}
	}

	log.Printf("Custom migrations completed: %d/%d indexes applied", successCount, len(indexMigrations))
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
