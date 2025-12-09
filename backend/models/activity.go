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
	ID            uint         `gorm:"primarykey" json:"id"`
	UserID        uint         `gorm:"not null;index" json:"user_id"`
	UserName      string       `json:"user_name"`
	UserEmail     string       `gorm:"index" json:"user_email"`
	AreaID        *uint        `gorm:"index" json:"area_id"`
	ProjectID     *uint        `gorm:"index" json:"project_id"`
	TaskID        *uint        `gorm:"index" json:"task_id"` // Nueva relación con Task
	ProjectName   string       `json:"project_name"`
	TaskName      string       `json:"task_name"` // Nombre de la tarea si aplica
	ActivityName  string       `json:"activity_name"`
	ActivityType  ActivityType `gorm:"type:varchar(50);index" json:"activity_type"`
	ExecutionTime float64      `gorm:"not null" json:"execution_time"` // hours
	Date          time.Time    `gorm:"type:date;not null;index" json:"date"`
	Month         string       `gorm:"type:varchar(7);index" json:"month"` // YYYY-MM format
	OtherArea     string       `json:"other_area"`
	Observations  string       `gorm:"type:text" json:"observations"`
	// Microsoft Calendar integration
	CalendarEventID *string        `gorm:"index" json:"calendar_event_id"` // ID del evento de calendario de Microsoft
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
