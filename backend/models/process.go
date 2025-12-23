package models

import (
	"time"

	"gorm.io/gorm"
)

// ProcessStatus representa el estado de un proceso
type ProcessStatus string

const (
	ProcessStatusPending    ProcessStatus = "pending"
	ProcessStatusInProgress ProcessStatus = "in_progress"
	ProcessStatusCompleted  ProcessStatus = "completed"
	ProcessStatusOnHold     ProcessStatus = "on_hold"
	ProcessStatusCancelled  ProcessStatus = "cancelled"
)

// Process representa un proceso que puede pertenecer a un requerimiento, incidente o actividad principal
type Process struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	Name        string        `json:"name" gorm:"not null;size:255"`
	Description string        `json:"description" gorm:"type:text"`
	Status      ProcessStatus `json:"status" gorm:"not null;default:'pending';index"`

	// Un proceso puede pertenecer a uno de estos tres tipos
	RequirementID *uint        `json:"requirement_id,omitempty" gorm:"index"`
	Requirement   *Requirement `json:"requirement,omitempty" gorm:"foreignKey:RequirementID"`

	IncidentID *uint     `json:"incident_id,omitempty" gorm:"index"`
	Incident   *Incident `json:"incident,omitempty" gorm:"foreignKey:IncidentID"`

	// ActivityID sin constraint automático para evitar problemas de orden en migración
	ActivityID *uint     `json:"activity_id,omitempty" gorm:"index"`
	Activity   *Activity `json:"activity,omitempty" gorm:"foreignKey:ActivityID;constraint:OnDelete:SET NULL,OnUpdate:CASCADE;references:ID"`

	// Actividades del proceso
	Activities []ProcessActivity `json:"activities,omitempty" gorm:"foreignKey:ProcessID"`

	// Usuarios asignados al proceso (many-to-many)
	AssignedUsers []User `json:"assigned_users,omitempty" gorm:"many2many:process_assignments;"`

	// Estimaciones y seguimiento
	EstimatedHours float64 `json:"estimated_hours" gorm:"default:0"`
	UsedHours      float64 `json:"used_hours" gorm:"default:0"`

	// Auditoría
	CreatedBy uint           `json:"created_by" gorm:"not null;index"`
	Creator   *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (Process) TableName() string {
	return "processes"
}

// BeforeCreate hook para validaciones antes de crear
func (p *Process) BeforeCreate(tx *gorm.DB) error {
	// Validar que el estado sea válido
	validStatuses := map[ProcessStatus]bool{
		ProcessStatusPending:    true,
		ProcessStatusInProgress: true,
		ProcessStatusCompleted:  true,
		ProcessStatusOnHold:     true,
		ProcessStatusCancelled:  true,
	}
	if !validStatuses[p.Status] {
		p.Status = ProcessStatusPending
	}

	return nil
}

// ProcessActivity representa una actividad dentro de un proceso
type ProcessActivity struct {
	ID          uint     `json:"id" gorm:"primaryKey"`
	ProcessID   uint     `json:"process_id" gorm:"not null;index"`
	Process     *Process `json:"process,omitempty" gorm:"foreignKey:ProcessID"`
	Name        string   `json:"name" gorm:"not null;size:255"`
	Description string   `json:"description" gorm:"type:text"`

	// Estado de la actividad (reutilizamos ActivityStatus)
	Status ActivityStatus `json:"status" gorm:"not null;default:'pending';index"`

	// Orden de ejecución
	Order int `json:"order" gorm:"default:0;index"`

	// Dependencias - una actividad puede depender de otra
	DependsOnID *uint            `json:"depends_on_id,omitempty" gorm:"index"`
	DependsOn   *ProcessActivity `json:"depends_on,omitempty" gorm:"foreignKey:DependsOnID"`

	// Usuario asignado a esta actividad específica
	AssignedUserID uint  `json:"assigned_user_id" gorm:"not null;index"`
	AssignedUser   *User `json:"assigned_user,omitempty" gorm:"foreignKey:AssignedUserID"`

	// Estimaciones y seguimiento
	EstimatedHours float64 `json:"estimated_hours" gorm:"default:0"`
	UsedHours      float64 `json:"used_hours" gorm:"default:0"`

	// Fechas
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`

	// Auditoría
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName especifica el nombre de la tabla
func (ProcessActivity) TableName() string {
	return "process_activities"
}

// BeforeCreate hook para validaciones antes de crear
func (pa *ProcessActivity) BeforeCreate(tx *gorm.DB) error {
	// Validar que el estado sea válido
	validStatuses := map[ActivityStatus]bool{
		ActivityStatusPending:    true,
		ActivityStatusInProgress: true,
		ActivityStatusCompleted:  true,
		ActivityStatusOnHold:     true,
	}
	if !validStatuses[pa.Status] {
		pa.Status = ActivityStatusPending
	}

	// No permitir dependencias circulares (validación básica)
	if pa.DependsOnID != nil && *pa.DependsOnID == pa.ID {
		return gorm.ErrInvalidData
	}

	return nil
}

// CanStart verifica si una actividad puede comenzar (dependencias cumplidas)
func (pa *ProcessActivity) CanStart(tx *gorm.DB) bool {
	// Si no tiene dependencias, puede comenzar
	if pa.DependsOnID == nil {
		return true
	}

	// Verificar que la dependencia esté completada
	var dependency ProcessActivity
	if err := tx.First(&dependency, *pa.DependsOnID).Error; err != nil {
		return false
	}

	return dependency.Status == ActivityStatusCompleted
}
