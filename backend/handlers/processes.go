package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// GetProcesses godoc
// @Summary Get processes with filters
// @Description Get list of processes with optional filters
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param requirement_id query int false "Filter by requirement ID"
// @Param incident_id query int false "Filter by incident ID"
// @Param activity_id query int false "Filter by activity ID"
// @Param status query string false "Filter by status"
// @Success 200 {object} utils.Response{data=[]models.Process}
// @Failure 401 {object} utils.Response
// @Router /processes [get]
func GetProcesses(c *gin.Context) {
	query := config.DB.Preload("Creator").
		Preload("Requirement").
		Preload("Incident").
		Preload("AssignedUsers").
		Preload("Activities").
		Preload("Activities.AssignedUser")

	// Filtro por requirement_id
	if reqIDStr := c.Query("requirement_id"); reqIDStr != "" {
		if reqID, err := strconv.ParseUint(reqIDStr, 10, 32); err == nil {
			query = query.Where("requirement_id = ?", uint(reqID))
		}
	}

	// Filtro por incident_id
	if incIDStr := c.Query("incident_id"); incIDStr != "" {
		if incID, err := strconv.ParseUint(incIDStr, 10, 32); err == nil {
			query = query.Where("incident_id = ?", uint(incID))
		}
	}

	// Filtro por activity_id
	if actIDStr := c.Query("activity_id"); actIDStr != "" {
		if actID, err := strconv.ParseUint(actIDStr, 10, 32); err == nil {
			query = query.Where("activity_id = ?", uint(actID))
		}
	}

	// Filtro por status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var processes []models.Process
	if err := query.Order("created_at DESC").Find(&processes).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve processes")
		return
	}

	utils.SuccessResponse(c, 200, "Processes retrieved successfully", processes)
}

// CreateProcess godoc
// @Summary Create a new process
// @Description Create a new process optionally linked to requirement, incident, or activity
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param process body CreateProcessGenericRequest true "Process data"
// @Success 201 {object} utils.Response{data=models.Process}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /processes [post]
func CreateProcess(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can create processes")
		return
	}

	type CreateProcessGenericRequest struct {
		Name           string  `json:"name" binding:"required"`
		Description    string  `json:"description"`
		EstimatedHours float64 `json:"estimated_hours"`
		Status         string  `json:"status"`
		RequirementID  *uint   `json:"requirement_id"`
		IncidentID     *uint   `json:"incident_id"`
		ActivityID     *uint   `json:"activity_id"`
		UserIDs        []uint  `json:"user_ids"`
	}

	var req CreateProcessGenericRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Crear proceso
	process := models.Process{
		Name:           req.Name,
		Description:    req.Description,
		EstimatedHours: req.EstimatedHours,
		Status:         models.ProcessStatus(req.Status),
		RequirementID:  req.RequirementID,
		IncidentID:     req.IncidentID,
		ActivityID:     req.ActivityID,
		CreatedBy:      userID.(uint),
	}

	if process.Status == "" {
		process.Status = models.ProcessStatusPending
	}

	if err := config.DB.Create(&process).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create process: "+err.Error())
		return
	}

	// Asignar usuarios si se proporcionaron
	if len(req.UserIDs) > 0 {
		for _, userIDToAssign := range req.UserIDs {
			var user models.User
			if err := config.DB.First(&user, userIDToAssign).Error; err != nil {
				continue
			}
			config.DB.Model(&process).Association("AssignedUsers").Append(&user)
		}
	}

	// Cargar relaciones
	config.DB.Preload("Creator").
		Preload("Requirement").
		Preload("Incident").
		Preload("AssignedUsers").
		First(&process, process.ID)

	utils.SuccessResponse(c, 201, "Process created successfully", process)
}

// GetProcess godoc
// @Summary Get process details
// @Description Get detailed information about a specific process
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Process ID"
// @Success 200 {object} utils.Response{data=models.Process}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /processes/{id} [get]
func GetProcess(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	var process models.Process
	if err := config.DB.Preload("Creator").
		Preload("Requirement").
		Preload("Incident").
		Preload("AssignedUsers").
		Preload("Activities").
		Preload("Activities.AssignedUser").
		Preload("Activities.DependsOn").
		First(&process, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	utils.SuccessResponse(c, 200, "Process retrieved successfully", process)
}

// CreateProcessForRequirement godoc
// @Summary Create process for requirement
// @Description Create a new process associated with a requirement
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param requirement_id path int true "Requirement ID"
// @Param process body CreateProcessRequest true "Process data"
// @Success 201 {object} utils.Response{data=models.Process}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /requirements/{requirement_id}/processes [post]
func CreateProcessForRequirement(c *gin.Context) {
	requirementIDStr := c.Param("requirement_id")
	requirementID, err := strconv.ParseUint(requirementIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid requirement ID")
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Solo Admin y SuperAdmin pueden crear procesos
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can create processes")
		return
	}

	type CreateProcessRequest struct {
		Name           string  `json:"name" binding:"required"`
		Description    string  `json:"description"`
		EstimatedHours float64 `json:"estimated_hours"`
		Status         string  `json:"status"`
		UserIDs        []uint  `json:"user_ids"` // IDs de usuarios a asignar
	}

	var req CreateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Verificar que el requerimiento existe
	var requirement models.Requirement
	if err := config.DB.Preload("Project").First(&requirement, uint(requirementID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Requirement not found")
		return
	}

	// Admin solo puede crear procesos para requerimientos de su área
	if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && requirement.Project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *requirement.Project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only create processes for requirements in your area")
				return
			}
		}
	}

	// Crear proceso
	reqID := uint(requirementID)
	process := models.Process{
		Name:           req.Name,
		Description:    req.Description,
		EstimatedHours: req.EstimatedHours,
		Status:         models.ProcessStatus(req.Status),
		RequirementID:  &reqID,
		CreatedBy:      userID.(uint),
	}

	if process.Status == "" {
		process.Status = models.ProcessStatusPending
	}

	if err := config.DB.Create(&process).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create process: "+err.Error())
		return
	}

	// Asignar usuarios si se proporcionaron
	if len(req.UserIDs) > 0 {
		for _, userIDToAssign := range req.UserIDs {
			var user models.User
			if err := config.DB.First(&user, userIDToAssign).Error; err != nil {
				continue // Skip invalid users
			}
			config.DB.Model(&process).Association("AssignedUsers").Append(&user)
		}
	}

	// Cargar relaciones
	config.DB.Preload("Creator").Preload("Requirement").Preload("AssignedUsers").First(&process, process.ID)

	utils.SuccessResponse(c, 201, "Process created successfully", process)
}

// CreateProcessForIncident godoc
// @Summary Create process for incident
// @Description Create a new process associated with an incident
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param incident_id path int true "Incident ID"
// @Param process body CreateProcessRequest true "Process data"
// @Success 201 {object} utils.Response{data=models.Process}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /incidents/{incident_id}/processes [post]
func CreateProcessForIncident(c *gin.Context) {
	incidentIDStr := c.Param("incident_id")
	incidentID, err := strconv.ParseUint(incidentIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid incident ID")
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Admin y SuperAdmin pueden crear procesos, usuarios asignados también
	role := userRole.(models.Role)

	type CreateProcessRequest struct {
		Name           string  `json:"name" binding:"required"`
		Description    string  `json:"description"`
		EstimatedHours float64 `json:"estimated_hours"`
		Status         string  `json:"status"`
		UserIDs        []uint  `json:"user_ids"`
	}

	var req CreateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Verificar que el incidente existe
	var incident models.Incident
	if err := config.DB.Preload("Project").First(&incident, uint(incidentID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Incident not found")
		return
	}

	// Verificar permisos
	if role == models.RoleUser {
		// Usuario debe estar asignado al proyecto o ser el reportero
		var count int64
		config.DB.Model(&models.ProjectAssignment{}).
			Where("project_id = ? AND user_id = ? AND is_active = ?", incident.ProjectID, userID, true).
			Count(&count)
		if count == 0 && incident.ReportedBy != userID.(uint) {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	} else if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && incident.Project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *incident.Project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only create processes for incidents in your area")
				return
			}
		}
	}

	// Crear proceso
	incID := uint(incidentID)
	process := models.Process{
		Name:           req.Name,
		Description:    req.Description,
		EstimatedHours: req.EstimatedHours,
		Status:         models.ProcessStatus(req.Status),
		IncidentID:     &incID,
		CreatedBy:      userID.(uint),
	}

	if process.Status == "" {
		process.Status = models.ProcessStatusPending
	}

	if err := config.DB.Create(&process).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create process: "+err.Error())
		return
	}

	// Asignar usuarios
	if len(req.UserIDs) > 0 {
		for _, userIDToAssign := range req.UserIDs {
			var user models.User
			if err := config.DB.First(&user, userIDToAssign).Error; err != nil {
				continue
			}
			config.DB.Model(&process).Association("AssignedUsers").Append(&user)
		}
	}

	// Cargar relaciones
	config.DB.Preload("Creator").Preload("Incident").Preload("AssignedUsers").First(&process, process.ID)

	utils.SuccessResponse(c, 201, "Process created successfully", process)
}

// CreateProcessForActivity godoc
// @Summary Create process for activity
// @Description Create a new process associated with an activity
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param activity_id path int true "Activity ID"
// @Param process body CreateProcessRequest true "Process data"
// @Success 201 {object} utils.Response{data=models.Process}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /activities/{activity_id}/processes [post]
func CreateProcessForActivity(c *gin.Context) {
	activityIDStr := c.Param("activity_id")
	activityID, err := strconv.ParseUint(activityIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid activity ID")
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)

	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can create processes")
		return
	}

	type CreateProcessRequest struct {
		Name           string  `json:"name" binding:"required"`
		Description    string  `json:"description"`
		EstimatedHours float64 `json:"estimated_hours"`
		Status         string  `json:"status"`
		UserIDs        []uint  `json:"user_ids"`
	}

	var req CreateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Verificar que la actividad existe
	var activity models.Activity
	if err := config.DB.Preload("Project").First(&activity, uint(activityID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	// Crear proceso
	actID := uint(activityID)
	process := models.Process{
		Name:           req.Name,
		Description:    req.Description,
		EstimatedHours: req.EstimatedHours,
		Status:         models.ProcessStatus(req.Status),
		ActivityID:     &actID,
		CreatedBy:      userID.(uint),
	}

	if process.Status == "" {
		process.Status = models.ProcessStatusPending
	}

	if err := config.DB.Create(&process).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create process: "+err.Error())
		return
	}

	// Asignar usuarios
	if len(req.UserIDs) > 0 {
		for _, userIDToAssign := range req.UserIDs {
			var user models.User
			if err := config.DB.First(&user, userIDToAssign).Error; err != nil {
				continue
			}
			config.DB.Model(&process).Association("AssignedUsers").Append(&user)
		}
	}

	// Cargar relaciones
	config.DB.Preload("Creator").Preload("AssignedUsers").First(&process, process.ID)

	utils.SuccessResponse(c, 201, "Process created successfully", process)
}

// UpdateProcess godoc
// @Summary Update process
// @Description Update an existing process
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Process ID"
// @Param process body UpdateProcessRequest true "Updated process data"
// @Success 200 {object} utils.Response{data=models.Process}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /processes/{id} [put]
func UpdateProcess(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can update processes")
		return
	}

	type UpdateProcessRequest struct {
		Name           *string  `json:"name"`
		Description    *string  `json:"description"`
		Status         *string  `json:"status"`
		EstimatedHours *float64 `json:"estimated_hours"`
		UsedHours      *float64 `json:"used_hours"`
	}

	var req UpdateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var process models.Process
	if err := config.DB.First(&process, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	// Actualizar campos
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.EstimatedHours != nil {
		updates["estimated_hours"] = *req.EstimatedHours
	}
	if req.UsedHours != nil {
		updates["used_hours"] = *req.UsedHours
	}
	updates["updated_at"] = time.Now()

	if err := config.DB.Model(&process).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update process")
		return
	}

	// Recargar con relaciones
	config.DB.Preload("Creator").
		Preload("Requirement").
		Preload("Incident").
		Preload("Assignments").
		Preload("Assignments.User").
		First(&process, uint(id))

	utils.SuccessResponse(c, 200, "Process updated successfully", process)
}

// DeleteProcess godoc
// @Summary Delete process
// @Description Soft delete a process (Admin/SuperAdmin only)
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Process ID"
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /processes/{id} [delete]
func DeleteProcess(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can delete processes")
		return
	}

	var process models.Process
	if err := config.DB.First(&process, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	if err := config.DB.Delete(&process).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete process")
		return
	}

	utils.SuccessResponse(c, 200, "Process deleted successfully", gin.H{"message": "Process deleted successfully"})
}

// GetProcessActivities godoc
// @Summary Get process activities
// @Description Get list of activities for a specific process
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param process_id path int true "Process ID"
// @Success 200 {object} utils.Response{data=[]models.ProcessActivity}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /processes/{process_id}/activities [get]
func GetProcessActivities(c *gin.Context) {
	processIDStr := c.Param("process_id")
	processID, err := strconv.ParseUint(processIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	var process models.Process
	if err := config.DB.First(&process, uint(processID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	var activities []models.ProcessActivity
	if err := config.DB.Preload("AssignedUser").
		Preload("DependsOn").
		Where("process_id = ?", uint(processID)).
		Order("order_number ASC").
		Find(&activities).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch activities")
		return
	}

	utils.SuccessResponse(c, 200, "Activities retrieved successfully", activities)
}

// CreateProcessActivity godoc
// @Summary Create process activity
// @Description Create a new activity within a process
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param process_id path int true "Process ID"
// @Param activity body CreateProcessActivityRequest true "Activity data"
// @Success 201 {object} utils.Response{data=models.ProcessActivity}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /processes/{process_id}/activities [post]
func CreateProcessActivity(c *gin.Context) {
	processIDStr := c.Param("process_id")
	processID, err := strconv.ParseUint(processIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can create process activities")
		return
	}

	type CreateProcessActivityRequest struct {
		Name           string  `json:"name" binding:"required"`
		Description    string  `json:"description"`
		EstimatedHours float64 `json:"estimated_hours"`
		AssignedUserID *uint   `json:"assigned_user_id"`
		DependsOnID    *uint   `json:"depends_on_id"`
		OrderNumber    int     `json:"order_number"`
	}

	var req CreateProcessActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Verificar que el proceso existe
	var process models.Process
	if err := config.DB.First(&process, uint(processID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	// Verificar dependencia si se proporciona
	if req.DependsOnID != nil {
		var dependsOn models.ProcessActivity
		if err := config.DB.Where("id = ? AND process_id = ?", *req.DependsOnID, uint(processID)).First(&dependsOn).Error; err != nil {
			utils.ErrorResponse(c, 400, "Invalid dependency: activity not found in this process")
			return
		}
	}

	// Crear actividad
	activity := models.ProcessActivity{
		ProcessID:      uint(processID),
		Name:           req.Name,
		Description:    req.Description,
		EstimatedHours: req.EstimatedHours,
		DependsOnID:    req.DependsOnID,
		Status:         models.ActivityStatusPending,
	}

	if req.AssignedUserID != nil {
		activity.AssignedUserID = *req.AssignedUserID
	}

	if err := config.DB.Create(&activity).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create activity: "+err.Error())
		return
	}

	// Cargar relaciones
	config.DB.Preload("AssignedUser").Preload("DependsOn").First(&activity, activity.ID)

	utils.SuccessResponse(c, 201, "Activity created successfully", activity)
}

// UpdateProcessActivity godoc
// @Summary Update process activity
// @Description Update an existing process activity
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Param activity body UpdateProcessActivityRequest true "Updated activity data"
// @Success 200 {object} utils.Response{data=models.ProcessActivity}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /process-activities/{id} [put]
func UpdateProcessActivity(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid activity ID")
		return
	}

	type UpdateProcessActivityRequest struct {
		Name           *string  `json:"name"`
		Description    *string  `json:"description"`
		Status         *string  `json:"status"`
		EstimatedHours *float64 `json:"estimated_hours"`
		UsedHours      *float64 `json:"used_hours"`
		AssignedUserID *uint    `json:"assigned_user_id"`
	}

	var req UpdateProcessActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var activity models.ProcessActivity
	if err := config.DB.First(&activity, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	// Actualizar campos
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.EstimatedHours != nil {
		updates["estimated_hours"] = *req.EstimatedHours
	}
	if req.UsedHours != nil {
		updates["used_hours"] = *req.UsedHours
	}
	if req.AssignedUserID != nil {
		updates["assigned_user_id"] = *req.AssignedUserID
	}
	updates["updated_at"] = time.Now()

	if err := config.DB.Model(&activity).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update activity")
		return
	}

	// Recargar con relaciones
	config.DB.Preload("AssignedUser").Preload("DependsOn").First(&activity, uint(id))

	utils.SuccessResponse(c, 200, "Activity updated successfully", activity)
}

// AssignUserToProcess godoc
// @Summary Assign user to process
// @Description Assign a user to a process
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param process_id path int true "Process ID"
// @Param assignment body AssignUserRequest true "User assignment data"
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /processes/{process_id}/assign [post]
func AssignUserToProcess(c *gin.Context) {
	processIDStr := c.Param("process_id")
	processID, err := strconv.ParseUint(processIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)

	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can assign users to processes")
		return
	}

	type AssignUserRequest struct {
		UserID uint `json:"user_id" binding:"required"`
	}

	var req AssignUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Verificar que el proceso existe
	var process models.Process
	if err := config.DB.Preload("AssignedUsers").First(&process, uint(processID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	// Verificar que el usuario existe
	var user models.User
	if err := config.DB.First(&user, req.UserID).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	// Verificar si ya está asignado
	for _, assignedUser := range process.AssignedUsers {
		if assignedUser.ID == req.UserID {
			utils.ErrorResponse(c, 400, "User already assigned to this process")
			return
		}
	}

	// Agregar usuario mediante GORM association
	if err := config.DB.Model(&process).Association("AssignedUsers").Append(&user); err != nil {
		utils.ErrorResponse(c, 500, "Failed to assign user")
		return
	}

	utils.SuccessResponse(c, 200, "User assigned successfully", gin.H{"message": "User assigned successfully"})
}

// GetProcessAssignments godoc
// @Summary Get process assignments
// @Description Get list of users assigned to a process
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Process ID"
// @Success 200 {object} utils.Response{data=[]models.User}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /processes/{id}/assignments [get]
func GetProcessAssignments(c *gin.Context) {
	processIDStr := c.Param("id")
	processID, err := strconv.ParseUint(processIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	var process models.Process
	if err := config.DB.Preload("AssignedUsers").First(&process, uint(processID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Process not found")
		return
	}

	utils.SuccessResponse(c, 200, "Process assignments retrieved successfully", process.AssignedUsers)
}

// ValidateDependencies godoc
// @Summary Validate if activity can start
// @Description Check if an activity's dependencies are met and it can start
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Success 200 {object} utils.Response{data=map[string]interface{}}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /process-activities/{id}/can-start [get]
func ValidateDependencies(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid activity ID")
		return
	}

	var activity models.ProcessActivity
	if err := config.DB.Preload("DependsOn").First(&activity, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	canStart := activity.CanStart(config.DB)

	response := gin.H{
		"can_start":     canStart,
		"activity_id":   activity.ID,
		"activity_name": activity.Name,
		"status":        activity.Status,
	}

	if activity.DependsOnID != nil && activity.DependsOn != nil {
		response["depends_on"] = gin.H{
			"id":     activity.DependsOn.ID,
			"name":   activity.DependsOn.Name,
			"status": activity.DependsOn.Status,
		}
	}

	utils.SuccessResponse(c, 200, "Dependency validation completed", response)
}
