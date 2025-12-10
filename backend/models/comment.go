package models

import (
	"time"

	"gorm.io/gorm"
)

// Comment represents a comment on a task or project
type Comment struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	ProjectID *uint          `gorm:"index" json:"project_id"` // Comment on project (optional)
	TaskID    *uint          `gorm:"index" json:"task_id"`    // Comment on task (optional)
	Content   string         `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty" swaggerignore:"true"`
	Project *Project `gorm:"foreignKey:ProjectID" json:"project,omitempty" swaggerignore:"true"`
	Task    *Task    `gorm:"foreignKey:TaskID" json:"task,omitempty" swaggerignore:"true"`
}

// BeforeCreate validates that a comment belongs to either a project or a task
func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ProjectID == nil && c.TaskID == nil {
		return gorm.ErrInvalidData
	}
	return nil
}
