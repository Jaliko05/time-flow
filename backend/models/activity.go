package models

import (
	"time"

	"gorm.io/gorm"
)

type ActivityType string

const (
	ActivityTypePlanDeTrabajo                ActivityType = "plan_de_trabajo"
	ActivityTypeApoyoSolicitadoPorOtrasAreas ActivityType = "apoyo_solicitado_por_otras_areas"
	ActivityTypeTeams                        ActivityType = "teams"
	ActivityTypeInterno                      ActivityType = "interno"
	ActivityTypeSesion                       ActivityType = "sesion"
	ActivityTypeInvestigacion                ActivityType = "investigacion"
	ActivityTypePrototipado                  ActivityType = "prototipado"
	ActivityTypeDisenos                      ActivityType = "disenos"
	ActivityTypePruebas                      ActivityType = "pruebas"
	ActivityTypeDocumentacion                ActivityType = "documentacion"
)

// Activity represents a time tracking activity
type Activity struct {
	ID              uint           `gorm:"primarykey" json:"id"`
	UserID          uint           `gorm:"not null;index:idx_user_date" json:"user_id"` // Composite index with date
	UserName        string         `json:"user_name"`                                   // Denormalized for performance
	UserEmail       string         `json:"user_email"`                                  // Denormalized for performance
	AreaID          *uint          `gorm:"index:idx_area_date" json:"area_id"`          // Composite index with date
	ProjectID       *uint          `gorm:"index:idx_project_date" json:"project_id"`    // Composite index with date
	TaskID          *uint          `gorm:"index" json:"task_id"`
	ProjectName     string         `json:"project_name"` // Denormalized for performance
	TaskName        string         `json:"task_name"`    // Denormalized for performance
	ActivityName    string         `json:"activity_name"`
	ActivityType    ActivityType   `gorm:"type:varchar(50);index" json:"activity_type"`
	ExecutionTime   float64        `gorm:"not null;default:0" json:"execution_time"`
	Date            time.Time      `gorm:"type:date;not null;index:idx_user_date;index:idx_area_date;index:idx_project_date" json:"date"` // Part of multiple composite indexes
	Month           string         `gorm:"type:varchar(7);index" json:"month"`
	OtherArea       string         `json:"other_area"`
	Observations    string         `gorm:"type:text" json:"observations"`
	CalendarEventID *string        `gorm:"uniqueIndex" json:"calendar_event_id"` // Changed to unique for calendar sync
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty" swaggerignore:"true"`
	Area    *Area    `gorm:"foreignKey:AreaID" json:"area,omitempty" swaggerignore:"true"`
	Project *Project `gorm:"foreignKey:ProjectID" json:"project,omitempty" swaggerignore:"true"`
	Task    *Task    `gorm:"foreignKey:TaskID" json:"task,omitempty" swaggerignore:"true"`
}

// BeforeCreate hook to set month field automatically
func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	if a.Month == "" {
		a.Month = a.Date.Format("2006-01")
	}
	return nil
}

// BeforeUpdate hook to update month if date changes
func (a *Activity) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Date") {
		a.Month = a.Date.Format("2006-01")
	}
	return nil
}
