package models

import (
	"time"

	"gorm.io/gorm"
)

// IncidentSeverity representa la severidad de un incidente
type IncidentSeverity string

const (
	IncidentSeverityLow      IncidentSeverity = "low"
	IncidentSeverityMedium   IncidentSeverity = "medium"
	IncidentSeverityHigh     IncidentSeverity = "high"
	IncidentSeverityCritical IncidentSeverity = "critical"
)

// IncidentStatus representa el estado de un incidente
type IncidentStatus string

const (
	IncidentStatusOpen       IncidentStatus = "open"
	IncidentStatusInProgress IncidentStatus = "in_progress"
	IncidentStatusResolved   IncidentStatus = "resolved"
	IncidentStatusClosed     IncidentStatus = "closed"
	IncidentStatusReopened   IncidentStatus = "reopened"
)

// Incident representa un incidente dentro de un proyecto
type Incident struct {
	ID          uint             `json:"id" gorm:"primaryKey"`
	ProjectID   uint             `json:"project_id" gorm:"not null;index"`
	Project     *Project         `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	Name        string           `json:"name" gorm:"not null;size:255"`
	Description string           `json:"description" gorm:"type:text"`
	Severity    IncidentSeverity `json:"severity" gorm:"not null;default:'medium';index"`
	Status      IncidentStatus   `json:"status" gorm:"not null;default:'open';index"`

	// Procesos asociados a este incidente (procesos de resolución)
	Processes []Process `json:"processes,omitempty" gorm:"foreignKey:IncidentID"`

	// Auditoría
	ReportedBy uint           `json:"reported_by" gorm:"not null;index"`
	Reporter   *User          `json:"reporter,omitempty" gorm:"foreignKey:ReportedBy"`
	ResolvedBy *uint          `json:"resolved_by,omitempty" gorm:"index"`
	Resolver   *User          `json:"resolver,omitempty" gorm:"foreignKey:ResolvedBy"`
	ResolvedAt *time.Time     `json:"resolved_at,omitempty"`
	CreatedAt  time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (Incident) TableName() string {
	return "incidents"
}

// BeforeCreate hook para validaciones antes de crear
func (i *Incident) BeforeCreate(tx *gorm.DB) error {
	// Validar que la severidad sea válida
	validSeverities := map[IncidentSeverity]bool{
		IncidentSeverityLow:      true,
		IncidentSeverityMedium:   true,
		IncidentSeverityHigh:     true,
		IncidentSeverityCritical: true,
	}
	if !validSeverities[i.Severity] {
		i.Severity = IncidentSeverityMedium
	}

	// Validar que el estado sea válido
	validStatuses := map[IncidentStatus]bool{
		IncidentStatusOpen:       true,
		IncidentStatusInProgress: true,
		IncidentStatusResolved:   true,
		IncidentStatusClosed:     true,
		IncidentStatusReopened:   true,
	}
	if !validStatuses[i.Status] {
		i.Status = IncidentStatusOpen
	}

	return nil
}

// BeforeUpdate hook para manejar cambios de estado
func (i *Incident) BeforeUpdate(tx *gorm.DB) error {
	// Si el estado cambia a resolved o closed, registrar timestamp
	if i.Status == IncidentStatusResolved || i.Status == IncidentStatusClosed {
		if i.ResolvedAt == nil {
			now := time.Now()
			i.ResolvedAt = &now
		}
	}
	return nil
}
