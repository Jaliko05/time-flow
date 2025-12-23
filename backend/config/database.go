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

	// Auto migrate schemas - FASE 1: Tablas principales sin Process
	if err := DB.AutoMigrate(
		// Tablas base (sin dependencias)
		&models.Area{},
		&models.User{},

		// Proyectos y relaciones básicas
		&models.Project{},
		&models.Activity{}, // Crear primero
		&models.Task{},
		&models.Comment{},
		&models.ProjectAssignment{},
		&models.TaskAssignment{},

		// Nueva estructura - Requerimientos e Incidentes
		&models.Requirement{}, // Depende de Project
		&models.Incident{},    // Depende de Project
	); err != nil {
		log.Fatalf("Failed to migrate database (Phase 1): %v", err)
	}

	log.Println("Database schema migrations (Phase 1) completed")

	// Auto migrate schemas - FASE 2: Process y ProcessActivity (ahora activities ya existe)
	if err := DB.AutoMigrate(
		&models.Process{},         // Ahora Activity ya existe
		&models.ProcessActivity{}, // Depende de Process
	); err != nil {
		log.Fatalf("Failed to migrate database (Phase 2): %v", err)
	}

	log.Println("Database schema migrations (Phase 2) completed")

	// Migrate existing data to new structure
	migrateExistingData()

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

	// Add new indexes for new structure
	newIndexMigrations := []struct {
		name      string
		tableName string
		sql       string
	}{
		{
			name:      "idx_requirements_project",
			tableName: "requirements",
			sql:       "CREATE INDEX IF NOT EXISTS idx_requirements_project ON requirements(project_id)",
		},
		{
			name:      "idx_requirements_status",
			tableName: "requirements",
			sql:       "CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status)",
		},
		{
			name:      "idx_incidents_project",
			tableName: "incidents",
			sql:       "CREATE INDEX IF NOT EXISTS idx_incidents_project ON incidents(project_id)",
		},
		{
			name:      "idx_incidents_severity",
			tableName: "incidents",
			sql:       "CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)",
		},
		{
			name:      "idx_processes_requirement",
			tableName: "processes",
			sql:       "CREATE INDEX IF NOT EXISTS idx_processes_requirement ON processes(requirement_id)",
		},
		{
			name:      "idx_processes_incident",
			tableName: "processes",
			sql:       "CREATE INDEX IF NOT EXISTS idx_processes_incident ON processes(incident_id)",
		},
		{
			name:      "idx_process_activities_process",
			tableName: "process_activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_process_activities_process ON process_activities(process_id)",
		},
		{
			name:      "idx_process_activities_depends_on",
			tableName: "process_activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_process_activities_depends_on ON process_activities(depends_on_id)",
		},
		{
			name:      "idx_activities_parent",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_parent ON activities(parent_activity_id)",
		},
		{
			name:      "idx_activities_process",
			tableName: "activities",
			sql:       "CREATE INDEX IF NOT EXISTS idx_activities_process ON activities(process_id)",
		},
	}

	// Apply new indexes
	for _, migration := range newIndexMigrations {
		if err := DB.Exec(migration.sql).Error; err != nil {
			log.Printf("Info: Index %s might already exist or table not created yet", migration.name)
		} else {
			log.Printf("✓ New index created/verified: %s on %s", migration.name, migration.tableName)
		}
	}
}

// migrateExistingData migrates existing data to new structure
func migrateExistingData() {
	log.Println("Migrating existing data to new structure...")

	// Migrate projects to project_areas (many-to-many)
	var projectsWithArea []models.Project
	if err := DB.Where("area_id IS NOT NULL").Find(&projectsWithArea).Error; err != nil {
		log.Printf("Warning: Could not fetch projects for migration: %v", err)
		return
	}

	migratedCount := 0
	for _, project := range projectsWithArea {
		// Check if already migrated
		var area models.Area
		if err := DB.Model(&project).Association("Areas").Find(&area); err == nil && area.ID > 0 {
			// Already has area in many-to-many, skip
			continue
		}

		// Add the area to the many-to-many relationship
		if project.AreaID != nil {
			var area models.Area
			if err := DB.First(&area, *project.AreaID).Error; err == nil {
				if err := DB.Model(&project).Association("Areas").Append(&area); err != nil {
					log.Printf("Warning: Failed to migrate project %d to project_areas: %v", project.ID, err)
				} else {
					migratedCount++
				}
			}
		}
	}

	if migratedCount > 0 {
		log.Printf("✓ Migrated %d projects to project_areas", migratedCount)
	} else {
		log.Println("No projects to migrate or already migrated")
	}
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
