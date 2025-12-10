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
	Name              string          `gorm:"not null" json:"name"`
	Description       string          `json:"description"`
	CreatedBy         uint            `gorm:"not null" json:"created_by"`
	AreaID            *uint           `json:"area_id"`
	AssignedUserID    *uint           `json:"assigned_user_id"`                                                 // Usuario asignado al proyecto
	ProjectType       ProjectType     `gorm:"type:varchar(20);not null;default:'personal'" json:"project_type"` // personal o area
	Status            ProjectStatus   `gorm:"type:varchar(20);not null;default:'unassigned'" json:"status"`     // Estado del proyecto
	Priority          ProjectPriority `gorm:"type:varchar(20);not null;default:'medium'" json:"priority"`       // Prioridad del proyecto
	EstimatedHours    float64         `json:"estimated_hours"`                                                  // Horas estimadas del proyecto
	UsedHours         float64         `json:"used_hours"`                                                       // Horas ya utilizadas
	RemainingHours    float64         `json:"remaining_hours"`                                                  // Horas restantes
	CompletionPercent float64         `json:"completion_percent"`                                               // Porcentaje de completitud
	StartDate         *time.Time      `json:"start_date"`                                                       // Fecha de inicio
	DueDate           *time.Time      `json:"due_date"`                                                         // Fecha de vencimiento
	CompletedAt       *time.Time      `json:"completed_at"`                                                     // Fecha de completado
	IsActive          bool            `gorm:"default:true" json:"is_active"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	DeletedAt         gorm.DeletedAt  `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Creator      User       `gorm:"foreignKey:CreatedBy" json:"creator,omitempty" swaggerignore:"true"`
	AssignedUser *User      `gorm:"foreignKey:AssignedUserID" json:"assigned_user,omitempty" swaggerignore:"true"`
	Area         *Area      `gorm:"foreignKey:AreaID" json:"area,omitempty" swaggerignore:"true"`
	Tasks        []Task     `gorm:"foreignKey:ProjectID" json:"tasks,omitempty" swaggerignore:"true"`
	Activities   []Activity `gorm:"foreignKey:ProjectID" json:"activities,omitempty" swaggerignore:"true"`
	Comments     []Comment  `gorm:"foreignKey:ProjectID" json:"comments,omitempty" swaggerignore:"true"`
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
