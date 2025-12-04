package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

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
	ProjectID         uint    `json:"project_id"`
	ProjectName       string  `json:"project_name"`
	AssignedUserID    *uint   `json:"assigned_user_id"`
	AssignedUserName  string  `json:"assigned_user_name,omitempty"`
	EstimatedHours    float64 `json:"estimated_hours"`
	UsedHours         float64 `json:"used_hours"`
	RemainingHours    float64 `json:"remaining_hours"`
	CompletionPercent float64 `json:"completion_percent"`
	IsActive          bool    `json:"is_active"`
}

// GetAreasSummary godoc
// @Summary Get summary by areas
// @Description Get aggregated statistics by area (SuperAdmin only)
// @Tags stats
// @Produce json
// @Security BearerAuth
// @Param area_id query int false "Filter by specific area ID"
// @Success 200 {object} utils.Response{data=[]AreaSummary}
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /stats/areas [get]
func GetAreasSummary(c *gin.Context) {
	userRole, _ := c.Get("user_role")

	// Only SuperAdmin can see all areas summary
	role := userRole.(models.Role)
	if role != models.RoleSuperAdmin {
		utils.ErrorResponse(c, 403, "Only SuperAdmin can access this endpoint")
		return
	}

	areaQuery := config.DB.Model(&models.Area{})

	// Filter by area if specified
	if areaIDStr := c.Query("area_id"); areaIDStr != "" {
		if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
			areaQuery = areaQuery.Where("id = ?", uint(areaID))
		}
	}

	var areas []models.Area
	areaQuery.Find(&areas)

	var summaries []AreaSummary

	for _, area := range areas {
		summary := AreaSummary{
			AreaID:   area.ID,
			AreaName: area.Name,
		}

		// Count users in area
		config.DB.Model(&models.User{}).Where("area_id = ? AND role = ?", area.ID, models.RoleUser).Count(&summary.TotalUsers)

		// Count projects in area
		config.DB.Model(&models.Project{}).Where("area_id = ?", area.ID).Count(&summary.TotalProjects)
		config.DB.Model(&models.Project{}).Where("area_id = ? AND is_active = ?", area.ID, true).Count(&summary.ActiveProjects)

		// Count activities and hours in area
		config.DB.Model(&models.Activity{}).Where("area_id = ?", area.ID).Count(&summary.TotalActivities)
		config.DB.Model(&models.Activity{}).Where("area_id = ?", area.ID).Select("COALESCE(SUM(execution_time), 0)").Scan(&summary.TotalHours)

		// Calculate average completion
		var projects []models.Project
		config.DB.Where("area_id = ?", area.ID).Find(&projects)
		if len(projects) > 0 {
			totalCompletion := 0.0
			for _, p := range projects {
				totalCompletion += p.CompletionPercent
			}
			summary.AverageCompletion = totalCompletion / float64(len(projects))
		}

		summaries = append(summaries, summary)
	}

	utils.SuccessResponse(c, 200, "Area summaries retrieved successfully", summaries)
}

// GetUsersSummary godoc
// @Summary Get summary by users
// @Description Get aggregated statistics by users. SuperAdmin sees all, Admin sees users in their area.
// @Tags stats
// @Produce json
// @Security BearerAuth
// @Param area_id query int false "Filter by area ID"
// @Param user_id query int false "Filter by specific user ID"
// @Success 200 {object} utils.Response{data=[]UserSummary}
// @Failure 401 {object} utils.Response
// @Router /stats/users [get]
func GetUsersSummary(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	userQuery := config.DB.Model(&models.User{}).Where("role = ?", models.RoleUser)

	// Apply role-based filters
	role := userRole.(models.Role)
	if role == models.RoleAdmin {
		// Admin only sees users in their area
		if userAreaID != nil {
			userQuery = userQuery.Where("area_id = ?", userAreaID)
		}
	} else if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Users cannot access this endpoint")
		return
	}

	// Optional filters
	if areaIDStr := c.Query("area_id"); areaIDStr != "" && role == models.RoleSuperAdmin {
		if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
			userQuery = userQuery.Where("area_id = ?", uint(areaID))
		}
	}

	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if userID, err := strconv.ParseUint(userIDStr, 10, 32); err == nil {
			userQuery = userQuery.Where("id = ?", uint(userID))
		}
	}

	var users []models.User
	userQuery.Find(&users)

	var summaries []UserSummary

	for _, user := range users {
		summary := UserSummary{
			UserID:    user.ID,
			UserName:  user.FullName,
			UserEmail: user.Email,
		}

		// Count activities and hours for this user
		config.DB.Model(&models.Activity{}).Where("user_id = ?", user.ID).Count(&summary.TotalActivities)
		config.DB.Model(&models.Activity{}).Where("user_id = ?", user.ID).Select("COALESCE(SUM(execution_time), 0)").Scan(&summary.TotalHours)

		// Count assigned projects
		config.DB.Model(&models.Project{}).Where("assigned_user_id = ?", user.ID).Count(&summary.AssignedProjects)

		// Calculate average completion of assigned projects
		var projects []models.Project
		config.DB.Where("assigned_user_id = ?", user.ID).Find(&projects)
		if len(projects) > 0 {
			totalCompletion := 0.0
			for _, p := range projects {
				totalCompletion += p.CompletionPercent
			}
			summary.AverageCompletion = totalCompletion / float64(len(projects))
		}

		summaries = append(summaries, summary)
	}

	utils.SuccessResponse(c, 200, "User summaries retrieved successfully", summaries)
}

// GetProjectsSummary godoc
// @Summary Get summary of projects
// @Description Get detailed statistics of projects. SuperAdmin sees all, Admin sees their area's projects.
// @Tags stats
// @Produce json
// @Security BearerAuth
// @Param area_id query int false "Filter by area ID"
// @Param assigned_user_id query int false "Filter by assigned user ID"
// @Param active query bool false "Filter by active status"
// @Success 200 {object} utils.Response{data=[]ProjectSummary}
// @Failure 401 {object} utils.Response
// @Router /stats/projects [get]
func GetProjectsSummary(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	projectQuery := config.DB.Model(&models.Project{}).Preload("AssignedUser")

	// Apply role-based filters
	role := userRole.(models.Role)
	if role == models.RoleAdmin {
		// Admin only sees projects in their area
		if userAreaID != nil {
			projectQuery = projectQuery.Where("area_id = ?", userAreaID)
		}
	} else if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Users cannot access this endpoint")
		return
	}

	// Optional filters
	if areaIDStr := c.Query("area_id"); areaIDStr != "" && role == models.RoleSuperAdmin {
		if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
			projectQuery = projectQuery.Where("area_id = ?", uint(areaID))
		}
	}

	if assignedUserIDStr := c.Query("assigned_user_id"); assignedUserIDStr != "" {
		if assignedUserID, err := strconv.ParseUint(assignedUserIDStr, 10, 32); err == nil {
			projectQuery = projectQuery.Where("assigned_user_id = ?", uint(assignedUserID))
		}
	}

	if activeStr := c.Query("active"); activeStr != "" {
		if activeStr == "true" {
			projectQuery = projectQuery.Where("is_active = ?", true)
		} else if activeStr == "false" {
			projectQuery = projectQuery.Where("is_active = ?", false)
		}
	}

	var projects []models.Project
	projectQuery.Find(&projects)

	var summaries []ProjectSummary

	for _, project := range projects {
		summary := ProjectSummary{
			ProjectID:         project.ID,
			ProjectName:       project.Name,
			AssignedUserID:    project.AssignedUserID,
			EstimatedHours:    project.EstimatedHours,
			UsedHours:         project.UsedHours,
			RemainingHours:    project.RemainingHours,
			CompletionPercent: project.CompletionPercent,
			IsActive:          project.IsActive,
		}

		if project.AssignedUser != nil {
			summary.AssignedUserName = project.AssignedUser.FullName
		}

		summaries = append(summaries, summary)
	}

	utils.SuccessResponse(c, 200, "Project summaries retrieved successfully", summaries)
}
