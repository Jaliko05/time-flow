package models

// ============================================
// Authentication Requests
// ============================================

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	AreaID   *uint  `json:"area_id"`
}

type MicrosoftLoginRequest struct {
	AccessToken string `json:"access_token" binding:"required"`
}

type CreateSuperAdminRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

// ============================================
// User Requests
// ============================================

type CreateUserRequest struct {
	Email        string      `json:"email" binding:"required,email"`
	Password     string      `json:"password" binding:"required,min=6"`
	FullName     string      `json:"full_name" binding:"required"`
	Role         Role        `json:"role" binding:"required"`
	AreaID       *uint       `json:"area_id"`
	WorkSchedule interface{} `json:"work_schedule"`
	LunchBreak   interface{} `json:"lunch_break"`
}

type UpdateUserRequest struct {
	Email        string      `json:"email" binding:"omitempty,email"`
	Password     string      `json:"password" binding:"omitempty,min=6"`
	FullName     string      `json:"full_name"`
	Role         Role        `json:"role"`
	AreaID       *uint       `json:"area_id"`
	WorkSchedule interface{} `json:"work_schedule"`
	LunchBreak   interface{} `json:"lunch_break"`
	IsActive     *bool       `json:"is_active"`
}

// ============================================
// Area Requests
// ============================================

type CreateAreaRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateAreaRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

// ============================================
// Project Requests
// ============================================

type CreateProjectRequest struct {
	Name            string          `json:"name" binding:"required"`
	Description     string          `json:"description"`
	ProjectType     ProjectType     `json:"project_type" binding:"required,oneof=personal area"` // personal o area
	AssignedUserID  *uint           `json:"assigned_user_id"`                                    // Deprecated: single user (for backward compatibility)
	AssignedUserIDs []uint          `json:"assigned_user_ids"`                                   // Multiple users to assign
	Priority        ProjectPriority `json:"priority" binding:"omitempty,oneof=low medium high critical"`
	EstimatedHours  float64         `json:"estimated_hours" binding:"omitempty,gte=0"` // Horas estimadas (opcional)
	StartDate       *string         `json:"start_date"`                                // Fecha de inicio en formato YYYY-MM-DD (opcional)
	DueDate         *string         `json:"due_date"`                                  // Fecha de vencimiento en formato YYYY-MM-DD (opcional)
}

type UpdateProjectRequest struct {
	Name            string           `json:"name"`
	Description     string           `json:"description"`
	AssignedUserID  *uint            `json:"assigned_user_id"`  // Deprecated: single user
	AssignedUserIDs []uint           `json:"assigned_user_ids"` // Multiple users to assign (replaces all current assignments)
	Priority        *ProjectPriority `json:"priority" binding:"omitempty,oneof=low medium high critical"`
	EstimatedHours  *float64         `json:"estimated_hours" binding:"omitempty,gt=0"`
	StartDate       *string          `json:"start_date"`
	DueDate         *string          `json:"due_date"`
	IsActive        *bool            `json:"is_active"`
}

type UpdateProjectStatusRequest struct {
	Status ProjectStatus `json:"status" binding:"required,oneof=unassigned assigned in_progress paused completed"`
}

// ============================================
// Task Requests
// ============================================

type CreateTaskRequest struct {
	ProjectID      uint         `json:"project_id" binding:"required"`
	Name           string       `json:"name" binding:"required"`
	Description    string       `json:"description"`
	Priority       TaskPriority `json:"priority" binding:"required,oneof=low medium high urgent"`
	AssignedUserID *uint        `json:"assigned_user_id"`
	EstimatedHours float64      `json:"estimated_hours" binding:"required,gt=0"`
	DueDate        *string      `json:"due_date"` // YYYY-MM-DD format
	Order          int          `json:"order"`
}

type UpdateTaskRequest struct {
	Name           string       `json:"name"`
	Description    string       `json:"description"`
	Priority       TaskPriority `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
	AssignedUserID *uint        `json:"assigned_user_id"`
	EstimatedHours *float64     `json:"estimated_hours" binding:"omitempty,gt=0"`
	DueDate        *string      `json:"due_date"` // YYYY-MM-DD format
	Order          *int         `json:"order"`
	IsActive       *bool        `json:"is_active"`
}

type UpdateTaskStatusRequest struct {
	Status TaskStatus `json:"status" binding:"required,oneof=backlog assigned in_progress paused completed"`
}

type BulkUpdateTaskOrderRequest struct {
	Tasks []struct {
		ID    uint `json:"id"`
		Order int  `json:"order"`
	} `json:"tasks" binding:"required,dive"`
}

// ============================================
// Activity Requests
// ============================================

type CreateActivityRequest struct {
	ProjectID       *uint        `json:"project_id"`
	TaskID          *uint        `json:"task_id"`
	ProjectName     string       `json:"project_name"`
	TaskName        string       `json:"task_name"`
	ActivityName    string       `json:"activity_name" binding:"required"`
	ActivityType    ActivityType `json:"activity_type" binding:"required"`
	ExecutionTime   float64      `json:"execution_time" binding:"required,gt=0"`
	Date            string       `json:"date" binding:"required"` // YYYY-MM-DD format
	OtherArea       string       `json:"other_area"`
	Observations    string       `json:"observations"`
	CalendarEventID *string      `json:"calendar_event_id"` // ID del evento de calendario
}

type UpdateActivityRequest struct {
	ProjectID     *uint        `json:"project_id"`
	TaskID        *uint        `json:"task_id"`
	ProjectName   string       `json:"project_name"`
	TaskName      string       `json:"task_name"`
	ActivityName  string       `json:"activity_name"`
	ActivityType  ActivityType `json:"activity_type"`
	ExecutionTime *float64     `json:"execution_time" binding:"omitempty,gt=0"`
	Date          string       `json:"date"` // YYYY-MM-DD format
	OtherArea     string       `json:"other_area"`
	Observations  string       `json:"observations"`
}

// ============================================
// Comment Requests
// ============================================

type CreateCommentRequest struct {
	ProjectID *uint  `json:"project_id"`
	TaskID    *uint  `json:"task_id"`
	Content   string `json:"content" binding:"required"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

// ============================================
// Calendar Requests
// ============================================

type GetCalendarEventsRequest struct {
	StartDate string `json:"start_date"` // formato: YYYY-MM-DD (opcional)
	EndDate   string `json:"end_date"`   // formato: YYYY-MM-DD (opcional)
}
