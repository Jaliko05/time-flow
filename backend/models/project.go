package models

import (
	"time"

	"gorm.io/gorm"
)

// ProjectType represents the type of project
type ProjectType string

const (
	ProjectTypePersonal ProjectType = "personal"
	ProjectTypeArea     ProjectType = "area"
)

// ProjectStatus represents the status of a project
type ProjectStatus string

const (
	ProjectStatusUnassigned ProjectStatus = "unassigned"
	ProjectStatusAssigned   ProjectStatus = "assigned"
	ProjectStatusInProgress ProjectStatus = "in_progress"
	ProjectStatusPaused     ProjectStatus = "paused"
	ProjectStatusCompleted  ProjectStatus = "completed"
)

// ProjectPriority represents the priority level of a project
type ProjectPriority string

const (
	ProjectPriorityLow      ProjectPriority = "low"
	ProjectPriorityMedium   ProjectPriority = "medium"
	ProjectPriorityHigh     ProjectPriority = "high"
	ProjectPriorityCritical ProjectPriority = "critical"
)

// Project represents a project in the system
type Project struct {
	ID                uint            `gorm:"primarykey" json:"id"`
	Name              string          `gorm:"not null;index" json:"name"` // Indexed for search
	Description       string          `gorm:"type:text" json:"description"`
	CreatedBy         uint            `gorm:"not null;index" json:"created_by"`                                       // Indexed for queries by creator
	AreaID            *uint           `gorm:"index" json:"area_id"`                                                   // Indexed for area filtering
	ProjectType       ProjectType     `gorm:"type:varchar(20);not null;default:'personal';index" json:"project_type"` // Indexed for filtering
	Status            ProjectStatus   `gorm:"type:varchar(20);not null;default:'unassigned';index" json:"status"`     // Indexed for status filtering
	Priority          ProjectPriority `gorm:"type:varchar(20);not null;default:'medium'" json:"priority"`
	EstimatedHours    float64         `gorm:"default:0" json:"estimated_hours"`
	UsedHours         float64         `gorm:"default:0" json:"used_hours"`
	RemainingHours    float64         `gorm:"default:0" json:"remaining_hours"`
	CompletionPercent float64         `gorm:"default:0" json:"completion_percent"`
	StartDate         *time.Time      `json:"start_date"`
	DueDate           *time.Time      `json:"due_date"`
	CompletedAt       *time.Time      `json:"completed_at"`
	IsActive          bool            `gorm:"default:true;index" json:"is_active"` // Indexed for active/inactive filtering
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	DeletedAt         gorm.DeletedAt  `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Creator User `gorm:"foreignKey:CreatedBy" json:"creator,omitempty" swaggerignore:"true"`

	// DEPRECATED: AreaID se mantiene por compatibilidad pero se usará Areas (many2many)
	Area *Area `gorm:"foreignKey:AreaID" json:"area,omitempty" swaggerignore:"true"`

	// NUEVO: Relación many-to-many con áreas (un proyecto puede pertenecer a múltiples áreas)
	Areas []Area `gorm:"many2many:project_areas;" json:"areas,omitempty" swaggerignore:"true"`

	Tasks      []Task     `gorm:"foreignKey:ProjectID" json:"tasks,omitempty" swaggerignore:"true"`
	Activities []Activity `gorm:"foreignKey:ProjectID" json:"activities,omitempty" swaggerignore:"true"`
	Comments   []Comment  `gorm:"foreignKey:ProjectID" json:"comments,omitempty" swaggerignore:"true"`

	// NUEVO: Requerimientos e Incidentes
	Requirements []Requirement `gorm:"foreignKey:ProjectID" json:"requirements,omitempty" swaggerignore:"true"`
	Incidents    []Incident    `gorm:"foreignKey:ProjectID" json:"incidents,omitempty" swaggerignore:"true"`

	AssignedUsers      []User              `gorm:"many2many:project_assignments;joinForeignKey:ProjectID;joinReferences:UserID" json:"assigned_users,omitempty" swaggerignore:"true"`
	ProjectAssignments []ProjectAssignment `gorm:"foreignKey:ProjectID" json:"project_assignments,omitempty" swaggerignore:"true"`
}

// BeforeSave hook to update project metrics
func (p *Project) BeforeSave(tx *gorm.DB) error {
	// Calculate remaining hours
	if p.EstimatedHours > 0 {
		p.RemainingHours = p.EstimatedHours - p.UsedHours
		if p.RemainingHours < 0 {
			p.RemainingHours = 0
		}

		// Calculate completion percent
		p.CompletionPercent = (p.UsedHours / p.EstimatedHours) * 100
		if p.CompletionPercent > 100 {
			p.CompletionPercent = 100
		}
	}

	// Set start date when status changes to in_progress
	if tx.Statement.Changed("Status") && p.Status == ProjectStatusInProgress && p.StartDate == nil {
		now := time.Now()
		p.StartDate = &now
	}

	// Set completed date when status changes to completed
	if tx.Statement.Changed("Status") && p.Status == ProjectStatusCompleted && p.CompletedAt == nil {
		now := time.Now()
		p.CompletedAt = &now
	}

	return nil
}

// CanRegisterActivity checks if a project can have activities registered
func (p *Project) CanRegisterActivity() bool {
	return p.Status == ProjectStatusInProgress || p.Status == ProjectStatusCompleted
}

// UpdateUsedHours updates the used hours from tasks and activities
func (p *Project) UpdateUsedHours(db *gorm.DB) error {
	var total float64

	// Sum hours from all activities related to this project
	err := db.Model(&Activity{}).
		Where("project_id = ?", p.ID).
		Select("COALESCE(SUM(execution_time), 0)").
		Scan(&total).Error

	if err != nil {
		return err
	}

	p.UsedHours = total
	return db.Save(p).Error
}
