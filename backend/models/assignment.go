package models

import (
	"time"

	"gorm.io/gorm"
)

// ProjectAssignment represents the many-to-many relationship between projects and users
// This allows multiple users to be assigned to a single project
type ProjectAssignment struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	ProjectID    uint           `gorm:"not null;index" json:"project_id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	AssignedBy   uint           `gorm:"not null" json:"assigned_by"`       // Who assigned this user
	AssignedAt   time.Time      `gorm:"autoCreateTime" json:"assigned_at"` // When was assigned
	CanModify    bool           `gorm:"default:true" json:"can_modify"`    // Can modify entire project
	IsActive     bool           `gorm:"default:true" json:"is_active"`     // Assignment is active
	UnassignedAt *time.Time     `json:"unassigned_at,omitempty"`           // When was unassigned
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Project        Project `gorm:"foreignKey:ProjectID" json:"project,omitempty" swaggerignore:"true"`
	User           User    `gorm:"foreignKey:UserID" json:"user,omitempty" swaggerignore:"true"`
	AssignedByUser User    `gorm:"foreignKey:AssignedBy" json:"assigned_by_user,omitempty" swaggerignore:"true"`
}

// TaskAssignment represents the many-to-many relationship between tasks and users
// This allows multiple users to be assigned to a single task
type TaskAssignment struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	TaskID       uint           `gorm:"not null;index" json:"task_id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	AssignedBy   uint           `gorm:"not null" json:"assigned_by"`       // Who assigned this user
	AssignedAt   time.Time      `gorm:"autoCreateTime" json:"assigned_at"` // When was assigned
	CanModify    bool           `gorm:"default:true" json:"can_modify"`    // Can modify this specific task
	IsActive     bool           `gorm:"default:true" json:"is_active"`     // Assignment is active
	UnassignedAt *time.Time     `json:"unassigned_at,omitempty"`           // When was unassigned
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Task           Task `gorm:"foreignKey:TaskID" json:"task,omitempty" swaggerignore:"true"`
	User           User `gorm:"foreignKey:UserID" json:"user,omitempty" swaggerignore:"true"`
	AssignedByUser User `gorm:"foreignKey:AssignedBy" json:"assigned_by_user,omitempty" swaggerignore:"true"`
}

// TableName specifies the table name for ProjectAssignment
func (ProjectAssignment) TableName() string {
	return "project_assignments"
}

// TableName specifies the table name for TaskAssignment
func (TaskAssignment) TableName() string {
	return "task_assignments"
}
