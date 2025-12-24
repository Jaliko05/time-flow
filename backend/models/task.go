package models

import (
	"time"

	"gorm.io/gorm"
)

// TaskStatus represents the status of a task
type TaskStatus string

const (
	TaskStatusBacklog    TaskStatus = "backlog"     // En backlog, no asignada
	TaskStatusAssigned   TaskStatus = "assigned"    // Asignada pero no iniciada
	TaskStatusInProgress TaskStatus = "in_progress" // En progreso
	TaskStatusPaused     TaskStatus = "paused"      // Pausada
	TaskStatusCompleted  TaskStatus = "completed"   // Completada
)

// TaskPriority represents the priority of a task
type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityHigh   TaskPriority = "high"
	TaskPriorityUrgent TaskPriority = "urgent"
)

// Task represents a task within a project
type Task struct {
	ID                uint           `gorm:"primarykey" json:"id"`
	ProjectID         uint           `gorm:"not null;index:idx_project_status" json:"project_id"` // Composite index with status
	ParentID          *uint          `gorm:"index" json:"parent_id,omitempty"`                    // Parent task for sub-tasks
	Name              string         `gorm:"not null" json:"name"`
	Description       string         `gorm:"type:text" json:"description"`
	Status            TaskStatus     `gorm:"type:varchar(20);not null;default:'backlog';index:idx_project_status" json:"status"` // Composite index
	Priority          TaskPriority   `gorm:"type:varchar(20);not null;default:'medium'" json:"priority"`
	CreatedBy         uint           `gorm:"not null" json:"created_by"`
	EstimatedHours    float64        `gorm:"default:0" json:"estimated_hours"`
	UsedHours         float64        `gorm:"default:0" json:"used_hours"`
	RemainingHours    float64        `gorm:"default:0" json:"remaining_hours"`
	CompletionPercent float64        `gorm:"default:0" json:"completion_percent"`
	StartDate         *time.Time     `json:"start_date"`
	EndDate           *time.Time     `json:"end_date"`
	DueDate           *time.Time     `json:"due_date"`
	Order             int            `gorm:"default:0" json:"order"`
	IsActive          bool           `gorm:"default:true" json:"is_active"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-" swaggerignore:"true"`

	// Relations
	Project         Project          `gorm:"foreignKey:ProjectID" json:"project,omitempty" swaggerignore:"true"`
	Parent          *Task            `gorm:"foreignKey:ParentID" json:"parent,omitempty" swaggerignore:"true"`
	SubTasks        []Task           `gorm:"foreignKey:ParentID" json:"sub_tasks,omitempty" swaggerignore:"true"`
	Creator         User             `gorm:"foreignKey:CreatedBy" json:"creator,omitempty" swaggerignore:"true"`
	Activities      []Activity       `gorm:"foreignKey:TaskID" json:"activities,omitempty" swaggerignore:"true"`
	Comments        []Comment        `gorm:"foreignKey:TaskID" json:"comments,omitempty" swaggerignore:"true"`
	AssignedUsers   []User           `gorm:"many2many:task_assignments;joinForeignKey:TaskID;joinReferences:UserID" json:"assigned_users,omitempty" swaggerignore:"true"`
	TaskAssignments []TaskAssignment `gorm:"foreignKey:TaskID" json:"task_assignments,omitempty" swaggerignore:"true"`
}

// BeforeSave hook to update task metrics
func (t *Task) BeforeSave(tx *gorm.DB) error {
	// Calculate remaining hours
	if t.EstimatedHours > 0 {
		t.RemainingHours = t.EstimatedHours - t.UsedHours
		if t.RemainingHours < 0 {
			t.RemainingHours = 0
		}

		// Calculate completion percent
		if t.EstimatedHours > 0 {
			t.CompletionPercent = (t.UsedHours / t.EstimatedHours) * 100
			if t.CompletionPercent > 100 {
				t.CompletionPercent = 100
			}
		}
	}

	// Set start date when status changes to in_progress
	if tx.Statement.Changed("Status") && t.Status == TaskStatusInProgress && t.StartDate == nil {
		now := time.Now()
		t.StartDate = &now
	}

	// Set end date when status changes to completed
	if tx.Statement.Changed("Status") && t.Status == TaskStatusCompleted && t.EndDate == nil {
		now := time.Now()
		t.EndDate = &now
	}

	return nil
}

// CanRegisterActivity checks if a task can have activities registered
func (t *Task) CanRegisterActivity() bool {
	return t.Status == TaskStatusInProgress || t.Status == TaskStatusCompleted
}

// CanBeAssigned checks if a task can be assigned to a user
func (t *Task) CanBeAssigned() bool {
	return t.Status == TaskStatusBacklog || t.Status == TaskStatusAssigned
}

// UpdateUsedHours updates the used hours from activities
func (t *Task) UpdateUsedHours(db *gorm.DB) error {
	var total float64
	err := db.Model(&Activity{}).
		Where("task_id = ?", t.ID).
		Select("COALESCE(SUM(execution_time), 0)").
		Scan(&total).Error

	if err != nil {
		return err
	}

	t.UsedHours = total
	return db.Save(t).Error
}
