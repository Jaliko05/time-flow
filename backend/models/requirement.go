package models

import (
	"time"

	"gorm.io/gorm"
)

// RequirementStatus representa el estado de un requerimiento
type RequirementStatus string

const (
	RequirementStatusPending    RequirementStatus = "pending"
	RequirementStatusInProgress RequirementStatus = "in_progress"
	RequirementStatusCompleted  RequirementStatus = "completed"
	RequirementStatusCancelled  RequirementStatus = "cancelled"
)

// Priority representa la prioridad de un requerimiento
type Priority string

const (
	PriorityLow      Priority = "low"
	PriorityMedium   Priority = "medium"
	PriorityHigh     Priority = "high"
	PriorityCritical Priority = "critical"
)

// Requirement representa un requerimiento dentro de un proyecto
type Requirement struct {
	ID          uint              `json:"id" gorm:"primaryKey"`
	ProjectID   uint              `json:"project_id" gorm:"not null;index"`
	Project     *Project          `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	Name        string            `json:"name" gorm:"not null;size:255"`
	Description string            `json:"description" gorm:"type:text"`
	Status      RequirementStatus `json:"status" gorm:"not null;default:'pending';index"`
	Priority    Priority          `json:"priority" gorm:"not null;default:'medium';index"`

	// Procesos asociados a este requerimiento
	Processes []Process `json:"processes,omitempty" gorm:"foreignKey:RequirementID"`

	// Auditoría
	CreatedBy uint           `json:"created_by" gorm:"not null;index"`
	Creator   *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (Requirement) TableName() string {
	return "requirements"
}

// BeforeCreate hook para validaciones antes de crear
func (r *Requirement) BeforeCreate(tx *gorm.DB) error {
	// Validar que el estado sea válido
	validStatuses := map[RequirementStatus]bool{
		RequirementStatusPending:    true,
		RequirementStatusInProgress: true,
		RequirementStatusCompleted:  true,
		RequirementStatusCancelled:  true,
	}
	if !validStatuses[r.Status] {
		r.Status = RequirementStatusPending
	}

	// Validar que la prioridad sea válida
	validPriorities := map[Priority]bool{
		PriorityLow:      true,
		PriorityMedium:   true,
		PriorityHigh:     true,
		PriorityCritical: true,
	}
	if !validPriorities[r.Priority] {
		r.Priority = PriorityMedium
	}

	return nil
}
