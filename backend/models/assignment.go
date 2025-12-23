package models

import (
	"time"

	"gorm.io/gorm"
)

// ProjectAssignment represents the many-to-many relationship between projects and users
// This allows multiple users to be assigned to a single project
type ProjectAssignment struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	ProjectID    uint           `gorm:"not null;index:idx_project_user,unique;index:idx_project_active" json:"project_id"` // Composite indexes
	UserID       uint           `gorm:"not null;index:idx_project_user,unique;index:idx_user_active" json:"user_id"`       // Composite indexes
	AssignedBy   uint           `gorm:"not null" json:"assigned_by"`
	AssignedAt   time.Time      `gorm:"autoCreateTime" json:"assigned_at"`
	CanModify    bool           `gorm:"default:true" json:"can_modify"`
	IsActive     bool           `gorm:"default:true;index:idx_project_active;index:idx_user_active" json:"is_active"` // Part of composite indexes
	UnassignedAt *time.Time     `json:"unassigned_at,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Project        Project `gorm:"foreignKey:ProjectID" json:"project,omitempty" swaggerignore:"true"`
	User           User    `gorm:"foreignKey:UserID" json:"user,omitempty" swaggerignore:"true"`
	AssignedByUser User    `gorm:"foreignKey:AssignedBy" json:"assigned_by_user,omitempty" swaggerignore:"true"`
}

// TaskAssignment represents the many-to-many relationship between tasks and users
// This allows multiple users to be assigned to a single task
type TaskAssignment struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	TaskID       uint           `gorm:"not null;index:idx_task_user,unique;index:idx_task_active" json:"task_id"`      // Composite indexes
	UserID       uint           `gorm:"not null;index:idx_task_user,unique;index:idx_user_task_active" json:"user_id"` // Composite indexes
	AssignedBy   uint           `gorm:"not null" json:"assigned_by"`
	AssignedAt   time.Time      `gorm:"autoCreateTime" json:"assigned_at"`
	CanModify    bool           `gorm:"default:true" json:"can_modify"`
	IsActive     bool           `gorm:"default:true;index:idx_task_active;index:idx_user_task_active" json:"is_active"` // Part of composite indexes
	UnassignedAt *time.Time     `json:"unassigned_at,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

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
