package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type CreateActivityRequest struct {
	ProjectID       *uint               `json:"project_id"`
	TaskID          *uint               `json:"task_id"`
	ProjectName     string              `json:"project_name"`
	TaskName        string              `json:"task_name"`
	ActivityName    string              `json:"activity_name" binding:"required"`
	ActivityType    models.ActivityType `json:"activity_type" binding:"required"`
	ExecutionTime   float64             `json:"execution_time" binding:"required,gt=0"`
	Date            string              `json:"date" binding:"required"` // YYYY-MM-DD format
	OtherArea       string              `json:"other_area"`
	Observations    string              `json:"observations"`
	CalendarEventID *string             `json:"calendar_event_id"` // ID del evento de calendario
}

type UpdateActivityRequest struct {
	ProjectID     *uint               `json:"project_id"`
	TaskID        *uint               `json:"task_id"`
	ProjectName   string              `json:"project_name"`
	TaskName      string              `json:"task_name"`
	ActivityName  string              `json:"activity_name"`
	ActivityType  models.ActivityType `json:"activity_type"`
	ExecutionTime *float64            `json:"execution_time" binding:"omitempty,gt=0"`
	Date          string              `json:"date"` // YYYY-MM-DD format
	OtherArea     string              `json:"other_area"`
	Observations  string              `json:"observations"`
}

type ActivityStats struct {
	TotalHours      float64            `json:"total_hours"`
	TotalActivities int64              `json:"total_activities"`
	UniqueUsers     int64              `json:"unique_users"`
	DailyAverage    float64            `json:"daily_average"`
	ByType          map[string]float64 `json:"by_type"`
	ByArea          map[string]float64 `json:"by_area"`
}

// GetActivities godoc
// @Summary Get activities
// @Description Get list of activities with filters. Users see their own, Admins see their area's, SuperAdmins see all.
// @Tags activities
// @Produce json
// @Security BearerAuth
// @Param user_id query int false "Filter by user ID"
// @Param user_email query string false "Filter by user email"
// @Param area_id query int false "Filter by area ID"
// @Param project_id query int false "Filter by project ID"
// @Param activity_type query string false "Filter by activity type"
// @Param date query string false "Filter by specific date (YYYY-MM-DD)"
// @Param month query string false "Filter by month (YYYY-MM)"
// @Param date_from query string false "Filter from date (YYYY-MM-DD)"
// @Param date_to query string false "Filter to date (YYYY-MM-DD)"
// @Success 200 {object} utils.Response{data=[]models.Activity}
// @Failure 401 {object} utils.Response
// @Router /activities [get]
func GetActivities(c *gin.Context) {
	currentUserID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Preload("User").Preload("Area").Preload("Project").Preload("Task")

	// Apply role-based filters
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Regular users only see their own activities
		query = query.Where("user_id = ?", currentUserID)
	} else if role == models.RoleAdmin {
		// Admins see activities from their area
		if userAreaID != nil {
			query = query.Where("area_id = ?", userAreaID)
		}
	}
	// SuperAdmin sees all activities

	// Apply query filters
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if userID, err := strconv.ParseUint(userIDStr, 10, 32); err == nil {
			query = query.Where("user_id = ?", uint(userID))
		}
	}

	if userEmail := c.Query("user_email"); userEmail != "" {
		query = query.Where("user_email = ?", userEmail)
	}

	if areaIDStr := c.Query("area_id"); areaIDStr != "" && role != models.RoleUser {
		if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
			query = query.Where("area_id = ?", uint(areaID))
		}
	}

	if projectIDStr := c.Query("project_id"); projectIDStr != "" {
		if projectID, err := strconv.ParseUint(projectIDStr, 10, 32); err == nil {
			query = query.Where("project_id = ?", uint(projectID))
		}
	}

	if activityType := c.Query("activity_type"); activityType != "" {
		query = query.Where("activity_type = ?", activityType)
	}

	if date := c.Query("date"); date != "" {
		if parsedDate, err := time.Parse("2006-01-02", date); err == nil {
			query = query.Where("date = ?", parsedDate)
		}
	}

	if month := c.Query("month"); month != "" {
		query = query.Where("month = ?", month)
	}

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateFrom); err == nil {
			query = query.Where("date >= ?", parsedDate)
		}
	}

	if dateTo := c.Query("date_to"); dateTo != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateTo); err == nil {
			query = query.Where("date <= ?", parsedDate)
		}
	}

	var activities []models.Activity
	if err := query.Order("date DESC, created_at DESC").Find(&activities).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve activities")
		return
	}

	utils.SuccessResponse(c, 200, "Activities retrieved successfully", activities)
}

// GetActivity godoc
// @Summary Get activity by ID
// @Description Get a specific activity
// @Tags activities
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Success 200 {object} utils.Response{data=models.Activity}
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /activities/{id} [get]
func GetActivity(c *gin.Context) {
	id := c.Param("id")
	currentUserID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var activity models.Activity
	query := config.DB.Preload("User").Preload("Area").Preload("Project").Preload("Task")

	if err := query.First(&activity, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	// Check access permissions
	role := userRole.(models.Role)
	if role == models.RoleUser && activity.UserID != currentUserID.(uint) {
		utils.ErrorResponse(c, 403, "Access denied")
		return
	}
	if role == models.RoleAdmin {
		if userAreaID == nil || activity.AreaID == nil || *activity.AreaID != *userAreaID.(*uint) {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}

	utils.SuccessResponse(c, 200, "Activity retrieved successfully", activity)
}

// CreateActivity godoc
// @Summary Create new activity
// @Description Create a new time tracking activity (Users only)
// @Tags activities
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param activity body CreateActivityRequest true "Activity data"
// @Success 201 {object} utils.Response{data=models.Activity}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /activities [post]
func CreateActivity(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userEmail, _ := c.Get("user_email")
	userAreaID, _ := c.Get("user_area_id")
	userRole, _ := c.Get("user_role")

	// Only users can create activities
	role := userRole.(models.Role)
	if role != models.RoleUser {
		utils.ErrorResponse(c, 403, "Only users can register activities")
		return
	}

	var req CreateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Parse date
	activityDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid date format. Use YYYY-MM-DD")
		return
	}

	// Get user info for full name
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	// If project_id is provided, validate user is assigned to it and update project hours
	if req.ProjectID != nil {
		var project models.Project
		if err := config.DB.First(&project, req.ProjectID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Project not found")
			return
		}

		// Validate project status allows activity registration
		if !project.CanRegisterActivity() {
			utils.ErrorResponse(c, 403, "Can only register activities for projects that are in progress or completed")
			return
		}

		// Validate user is assigned to this project or it's their personal project
		if project.ProjectType == models.ProjectTypePersonal {
			// For personal projects, only the creator can register activities
			if project.CreatedBy != userID.(uint) {
				utils.ErrorResponse(c, 403, "You can only register activities for your own personal projects")
				return
			}
		} else {
			// For area projects, user must be assigned to it
			if project.AssignedUserID == nil || *project.AssignedUserID != userID.(uint) {
				utils.ErrorResponse(c, 403, "You are not assigned to this project")
				return
			}
		}
	}

	// If task_id is provided, validate user is assigned to it and update task hours
	if req.TaskID != nil {
		var task models.Task
		if err := config.DB.Preload("Project").First(&task, req.TaskID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Task not found")
			return
		}

		// Validate task status allows activity registration
		if !task.CanRegisterActivity() {
			utils.ErrorResponse(c, 403, "Can only register activities for tasks that are in progress or completed")
			return
		}

		// Validate user is assigned to this task
		if task.AssignedUserID == nil || *task.AssignedUserID != userID.(uint) {
			utils.ErrorResponse(c, 403, "You are not assigned to this task")
			return
		}

		// If task has a project, also set project_id
		if req.ProjectID == nil {
			req.ProjectID = &task.ProjectID
		}
	}

	activity := models.Activity{
		UserID:          userID.(uint),
		UserEmail:       userEmail.(string),
		UserName:        user.FullName,
		AreaID:          userAreaID.(*uint),
		ProjectID:       req.ProjectID,
		TaskID:          req.TaskID,
		ProjectName:     req.ProjectName,
		TaskName:        req.TaskName,
		ActivityName:    req.ActivityName,
		ActivityType:    req.ActivityType,
		ExecutionTime:   req.ExecutionTime,
		Date:            activityDate,
		Month:           activityDate.Format("2006-01"),
		OtherArea:       req.OtherArea,
		Observations:    req.Observations,
		CalendarEventID: req.CalendarEventID,
	}

	if err := config.DB.Create(&activity).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create activity")
		return
	}

	// Update project hours if applicable
	if req.ProjectID != nil {
		var project models.Project
		if err := config.DB.First(&project, req.ProjectID).Error; err == nil {
			project.UpdateUsedHours(config.DB)
		}
	}

	// Update task hours if applicable
	if req.TaskID != nil {
		var task models.Task
		if err := config.DB.First(&task, req.TaskID).Error; err == nil {
			task.UpdateUsedHours(config.DB)
		}
	}

	// Reload to get relations
	config.DB.Preload("User").Preload("Area").Preload("Project").Preload("Task").First(&activity, activity.ID)

	utils.SuccessResponse(c, 201, "Activity created successfully", activity)
}

// UpdateActivity godoc
// @Summary Update activity
// @Description Update activity information (Owner only)
// @Tags activities
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Param activity body UpdateActivityRequest true "Activity data"
// @Success 200 {object} utils.Response{data=models.Activity}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /activities/{id} [put]
func UpdateActivity(c *gin.Context) {
	id := c.Param("id")
	currentUserID, _ := c.Get("user_id")

	var req UpdateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var activity models.Activity
	if err := config.DB.First(&activity, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	// Only activity owner can update
	if activity.UserID != currentUserID.(uint) {
		utils.ErrorResponse(c, 403, "Only activity owner can update")
		return
	}

	// If execution time changed and there's a project, update project hours
	if req.ExecutionTime != nil && activity.ProjectID != nil {
		var project models.Project
		if err := config.DB.First(&project, activity.ProjectID).Error; err == nil {
			// Remove old time and add new time
			project.UsedHours -= activity.ExecutionTime
			project.UsedHours += *req.ExecutionTime
			project.RemainingHours = project.EstimatedHours - project.UsedHours
			if project.EstimatedHours > 0 {
				project.CompletionPercent = (project.UsedHours / project.EstimatedHours) * 100
			}
			config.DB.Save(&project)
		}
	}

	// Update fields
	if req.ProjectID != nil {
		activity.ProjectID = req.ProjectID
	}
	if req.ProjectName != "" {
		activity.ProjectName = req.ProjectName
	}
	if req.ActivityName != "" {
		activity.ActivityName = req.ActivityName
	}
	if req.ActivityType != "" {
		activity.ActivityType = req.ActivityType
	}
	if req.ExecutionTime != nil {
		activity.ExecutionTime = *req.ExecutionTime
	}
	if req.Date != "" {
		if activityDate, err := time.Parse("2006-01-02", req.Date); err == nil {
			activity.Date = activityDate
			activity.Month = activityDate.Format("2006-01")
		}
	}
	if req.OtherArea != "" {
		activity.OtherArea = req.OtherArea
	}
	activity.Observations = req.Observations

	if err := config.DB.Save(&activity).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update activity")
		return
	}

	// Reload to get relations
	config.DB.Preload("User").Preload("Area").Preload("Project").First(&activity, activity.ID)

	utils.SuccessResponse(c, 200, "Activity updated successfully", activity)
}

// DeleteActivity godoc
// @Summary Delete activity
// @Description Soft delete an activity (Owner only)
// @Tags activities
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /activities/{id} [delete]
func DeleteActivity(c *gin.Context) {
	id := c.Param("id")
	currentUserID, _ := c.Get("user_id")

	var activity models.Activity
	if err := config.DB.First(&activity, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	// Only activity owner can delete
	if activity.UserID != currentUserID.(uint) {
		utils.ErrorResponse(c, 403, "Only activity owner can delete")
		return
	}

	// If activity has a project, update project hours
	if activity.ProjectID != nil {
		var project models.Project
		if err := config.DB.First(&project, activity.ProjectID).Error; err == nil {
			project.UsedHours -= activity.ExecutionTime
			project.RemainingHours = project.EstimatedHours - project.UsedHours
			if project.EstimatedHours > 0 {
				project.CompletionPercent = (project.UsedHours / project.EstimatedHours) * 100
			}
			config.DB.Save(&project)
		}
	}

	if err := config.DB.Delete(&activity).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete activity")
		return
	}

	utils.SuccessResponse(c, 200, "Activity deleted successfully", nil)
}

// GetActivityStats godoc
// @Summary Get activity statistics
// @Description Get aggregated statistics for activities with optional filters
// @Tags activities
// @Produce json
// @Security BearerAuth
// @Param user_id query int false "Filter by user ID"
// @Param area_id query int false "Filter by area ID"
// @Param month query string false "Filter by month (YYYY-MM)"
// @Param date_from query string false "Filter from date (YYYY-MM-DD)"
// @Param date_to query string false "Filter to date (YYYY-MM-DD)"
// @Success 200 {object} utils.Response{data=ActivityStats}
// @Failure 401 {object} utils.Response
// @Router /activities/stats [get]
func GetActivityStats(c *gin.Context) {
	currentUserID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Model(&models.Activity{})

	// Apply role-based filters
	role := userRole.(models.Role)
	if role == models.RoleUser {
		query = query.Where("user_id = ?", currentUserID)
	} else if role == models.RoleAdmin {
		if userAreaID != nil {
			query = query.Where("area_id = ?", userAreaID)
		}
	}

	// Apply query filters
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if userID, err := strconv.ParseUint(userIDStr, 10, 32); err == nil {
			query = query.Where("user_id = ?", uint(userID))
		}
	}

	if areaIDStr := c.Query("area_id"); areaIDStr != "" && role != models.RoleUser {
		if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
			query = query.Where("area_id = ?", uint(areaID))
		}
	}

	if month := c.Query("month"); month != "" {
		query = query.Where("month = ?", month)
	}

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateFrom); err == nil {
			query = query.Where("date >= ?", parsedDate)
		}
	}

	if dateTo := c.Query("date_to"); dateTo != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateTo); err == nil {
			query = query.Where("date <= ?", parsedDate)
		}
	}

	// Get total hours and count
	var totalHours float64
	var totalActivities int64

	query.Count(&totalActivities)
	query.Select("SUM(execution_time)").Scan(&totalHours)

	// Get unique users
	var uniqueUsers int64
	query.Distinct("user_id").Count(&uniqueUsers)

	// Calculate daily average
	var activities []models.Activity
	query.Select("date, execution_time").Find(&activities)

	dateHoursMap := make(map[string]float64)
	for _, act := range activities {
		dateStr := act.Date.Format("2006-01-02")
		dateHoursMap[dateStr] += act.ExecutionTime
	}

	dailyAverage := float64(0)
	if len(dateHoursMap) > 0 {
		dailyAverage = totalHours / float64(len(dateHoursMap))
	}

	// Group by type
	byType := make(map[string]float64)
	var typeResults []struct {
		ActivityType string
		TotalHours   float64
	}
	query.Select("activity_type, SUM(execution_time) as total_hours").
		Group("activity_type").
		Scan(&typeResults)

	for _, r := range typeResults {
		byType[r.ActivityType] = r.TotalHours
	}

	// Group by area
	byArea := make(map[string]float64)
	var areaResults []struct {
		AreaName   string
		TotalHours float64
	}
	config.DB.Table("activities").
		Select("areas.name as area_name, SUM(activities.execution_time) as total_hours").
		Joins("LEFT JOIN areas ON activities.area_id = areas.id").
		Where(query.Statement.SQL.String()).
		Group("areas.name").
		Scan(&areaResults)

	for _, r := range areaResults {
		byArea[r.AreaName] = r.TotalHours
	}

	stats := ActivityStats{
		TotalHours:      totalHours,
		TotalActivities: totalActivities,
		UniqueUsers:     uniqueUsers,
		DailyAverage:    dailyAverage,
		ByType:          byType,
		ByArea:          byArea,
	}

	utils.SuccessResponse(c, 200, "Statistics retrieved successfully", stats)
}
