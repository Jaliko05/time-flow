package models

import (
	"time"

	"gorm.io/gorm"
)

// Project represents a project in the system
type Project struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	CreatedBy   uint           `gorm:"not null" json:"created_by"`
	AreaID      *uint          `json:"area_id"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Creator    User       `gorm:"foreignKey:CreatedBy" json:"creator,omitempty" swaggerignore:"true"`
	Area       *Area      `gorm:"foreignKey:AreaID" json:"area,omitempty" swaggerignore:"true"`
	Activities []Activity `gorm:"foreignKey:ProjectID" json:"activities,omitempty" swaggerignore:"true"`
}
