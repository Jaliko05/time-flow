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

// Project represents a project in the system
type Project struct {
	ID                uint           `gorm:"primarykey" json:"id"`
	Name              string         `gorm:"not null" json:"name"`
	Description       string         `json:"description"`
	CreatedBy         uint           `gorm:"not null" json:"created_by"`
	AreaID            *uint          `json:"area_id"`
	AssignedUserID    *uint          `json:"assigned_user_id"`                                                 // Usuario asignado al proyecto
	ProjectType       ProjectType    `gorm:"type:varchar(20);not null;default:'personal'" json:"project_type"` // personal o area
	Status            ProjectStatus  `gorm:"type:varchar(20);not null;default:'unassigned'" json:"status"`     // Estado del proyecto
	EstimatedHours    float64        `json:"estimated_hours"`                                                  // Horas estimadas del proyecto
	UsedHours         float64        `json:"used_hours"`                                                       // Horas ya utilizadas
	RemainingHours    float64        `json:"remaining_hours"`                                                  // Horas restantes
	CompletionPercent float64        `json:"completion_percent"`                                               // Porcentaje de completitud
	IsActive          bool           `gorm:"default:true" json:"is_active"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Creator      User       `gorm:"foreignKey:CreatedBy" json:"creator,omitempty" swaggerignore:"true"`
	AssignedUser *User      `gorm:"foreignKey:AssignedUserID" json:"assigned_user,omitempty" swaggerignore:"true"`
	Area         *Area      `gorm:"foreignKey:AreaID" json:"area,omitempty" swaggerignore:"true"`
	Activities   []Activity `gorm:"foreignKey:ProjectID" json:"activities,omitempty" swaggerignore:"true"`
}

// CanRegisterActivity checks if a project can have activities registered
func (p *Project) CanRegisterActivity() bool {
	return p.Status == ProjectStatusInProgress || p.Status == ProjectStatusCompleted
}
