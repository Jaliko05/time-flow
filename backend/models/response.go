package models

import "time"

// ============================================
// Authentication Responses
// ============================================

type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID           uint        `json:"id"`
	Email        string      `json:"email"`
	FullName     string      `json:"full_name"`
	Role         Role        `json:"role"`
	AreaID       *uint       `json:"area_id"`
	Area         *Area       `json:"area,omitempty"`
	WorkSchedule interface{} `json:"work_schedule,omitempty"`
	LunchBreak   interface{} `json:"lunch_break,omitempty"`
	IsActive     bool        `json:"is_active"`
}

// ============================================
// Statistics Responses
// ============================================

type AreaSummary struct {
	AreaID            uint             `json:"area_id"`
	AreaName          string           `json:"area_name"`
	TotalUsers        int64            `json:"total_users"`
	TotalProjects     int64            `json:"total_projects"`
	ActiveProjects    int64            `json:"active_projects"`
	TotalActivities   int64            `json:"total_activities"`
	TotalHours        float64          `json:"total_hours"`
	AverageCompletion float64          `json:"average_completion"`
	UserStats         []UserSummary    `json:"user_stats,omitempty"`
	ProjectStats      []ProjectSummary `json:"project_stats,omitempty"`
}

type UserSummary struct {
	UserID            uint    `json:"user_id"`
	UserName          string  `json:"user_name"`
	UserEmail         string  `json:"user_email"`
	TotalActivities   int64   `json:"total_activities"`
	TotalHours        float64 `json:"total_hours"`
	AssignedProjects  int64   `json:"assigned_projects"`
	AverageCompletion float64 `json:"average_completion"`
}

type ProjectSummary struct {
	ProjectID         uint     `json:"project_id"`
	ProjectName       string   `json:"project_name"`
	AssignedUserIDs   []uint   `json:"assigned_user_ids"`
	AssignedUserNames []string `json:"assigned_user_names,omitempty"`
	EstimatedHours    float64  `json:"estimated_hours"`
	UsedHours         float64  `json:"used_hours"`
	RemainingHours    float64  `json:"remaining_hours"`
	CompletionPercent float64  `json:"completion_percent"`
	IsActive          bool     `json:"is_active"`
}

type ActivityStats struct {
	TotalHours      float64            `json:"total_hours"`
	TotalActivities int64              `json:"total_activities"`
	UniqueUsers     int64              `json:"unique_users"`
	DailyAverage    float64            `json:"daily_average"`
	ByType          map[string]float64 `json:"by_type"`
	ByArea          map[string]float64 `json:"by_area"`
}

// ============================================
// Calendar Responses
// ============================================

type CalendarEventResponse struct {
	ID          string    `json:"id"`
	Subject     string    `json:"subject"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location"`
	IsOnline    bool      `json:"is_online"`
	Duration    float64   `json:"duration_hours"`
}
