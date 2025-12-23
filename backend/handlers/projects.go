package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// GetProjects godoc
// @Summary Get projects
// @Description Get list of projects. Users see projects assigned to them, Admins see their area's projects, SuperAdmins see all.
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param area_id query int false "Filter by area ID (SuperAdmin only)"
// @Param assigned_user_id query int false "Filter by assigned user ID"
// @Param active query bool false "Filter by active status"
// @Success 200 {object} utils.Response{data=[]models.Project}
// @Failure 401 {object} utils.Response
// @Router /projects [get]
func GetProjects(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Preload("Creator").Preload("AssignedUsers").Preload("ProjectAssignments.User").Preload("Area").Preload("Areas")

	// Apply filters based on role
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Regular users see projects assigned to them through project_assignments
		query = query.Joins("LEFT JOIN project_assignments ON project_assignments.project_id = projects.id").
			Where("project_assignments.user_id = ? AND project_assignments.is_active = ?", userID, true)
	} else if role == models.RoleAdmin {
		// Admins see projects from their area
		if userAreaID != nil {
			query = query.Where("area_id = ?", userAreaID)
		}
	}
	// SuperAdmin sees all projects by default

	// Optional filters
	if areaIDStr := c.Query("area_id"); areaIDStr != "" && role == models.RoleSuperAdmin {
		if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
			query = query.Where("area_id = ?", uint(areaID))
		}
	}

	if assignedUserIDStr := c.Query("assigned_user_id"); assignedUserIDStr != "" {
		if assignedUserID, err := strconv.ParseUint(assignedUserIDStr, 10, 32); err == nil {
			query = query.Joins("LEFT JOIN project_assignments pa ON pa.project_id = projects.id").
				Where("pa.user_id = ? AND pa.is_active = ?", uint(assignedUserID), true)
		}
	}

	if activeStr := c.Query("active"); activeStr != "" {
		if activeStr == "true" {
			query = query.Where("is_active = ?", true)
		} else if activeStr == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	var projects []models.Project
	if err := query.Distinct().Order("created_at DESC").Find(&projects).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve projects")
		return
	}

	utils.SuccessResponse(c, 200, "Projects retrieved successfully", projects)
}

// GetProject godoc
// @Summary Get project by ID
// @Description Get a specific project
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Success 200 {object} utils.Response{data=models.Project}
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /projects/{id} [get]
func GetProject(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var project models.Project
	query := config.DB.Preload("Creator").Preload("AssignedUsers").Preload("ProjectAssignments.User").Preload("Area").Preload("Areas")

	if err := query.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check access permissions
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Users can only see projects assigned to them through project_assignments
		var assignment models.ProjectAssignment
		err := config.DB.Where("project_id = ? AND user_id = ? AND is_active = ?", project.ID, userID.(uint), true).
			First(&assignment).Error
		if err != nil {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}
	if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if project.AreaID == nil || *project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}

	utils.SuccessResponse(c, 200, "Project retrieved successfully", project)
}

// CreateProject godoc
// @Summary Create new project
// @Description Create a new project. Only Admins and SuperAdmins can create projects.
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param project body CreateProjectRequest true "Project data"
// @Success 201 {object} utils.Response{data=models.Project}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /projects [post]
func CreateProject(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	role := userRole.(models.Role)

	// NUEVO: Solo Admin y SuperAdmin pueden crear proyectos
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins and super admins can create projects")
		return
	}

	// Validation for project type
	if req.ProjectType == models.ProjectTypeArea {
		// Only admins can create area projects
		if role == models.RoleUser {
			utils.ErrorResponse(c, 403, "Only admins can create area projects")
			return
		}

		// Area projects must have area_id
		if userAreaID == nil {
			utils.ErrorResponse(c, 400, "Area ID is required for area projects")
			return
		}
	}

	// Set initial status based on project type and assignment
	initialStatus := models.ProjectStatusUnassigned
	if req.ProjectType == models.ProjectTypePersonal {
		initialStatus = models.ProjectStatusInProgress // Personal projects start in progress
		// Personal projects are auto-assigned to their creator
		if req.AssignedUserID == nil && len(req.AssignedUserIDs) == 0 {
			creatorID := userID.(uint)
			req.AssignedUserIDs = []uint{creatorID}
		}
	}

	// Merge single and multiple assignments for backward compatibility
	userIDsToAssign := req.AssignedUserIDs
	if req.AssignedUserID != nil {
		userIDsToAssign = append(userIDsToAssign, *req.AssignedUserID)
	}

	// Validate assigned users if provided
	var validatedUserIDs []uint
	if len(userIDsToAssign) > 0 {
		var adminAreaID *uint
		if role == models.RoleAdmin && req.ProjectType == models.ProjectTypeArea {
			areaID, ok := userAreaID.(*uint)
			if !ok || areaID == nil {
				utils.ErrorResponse(c, 403, "Admin must have an area assigned")
				return
			}
			adminAreaID = areaID
		}

		// Validate each user
		for _, userIDToAssign := range userIDsToAssign {
			var assignedUser models.User
			if err := config.DB.First(&assignedUser, userIDToAssign).Error; err != nil {
				utils.ErrorResponse(c, 404, "Assigned user not found: "+strconv.FormatUint(uint64(userIDToAssign), 10))
				return
			}

			// If admin creating area project, check that assigned user belongs to the same area
			if adminAreaID != nil {
				if assignedUser.AreaID == nil || *assignedUser.AreaID != *adminAreaID {
					utils.ErrorResponse(c, 403, "Can only assign users from your area")
					return
				}
			}

			validatedUserIDs = append(validatedUserIDs, userIDToAssign)
		}

		if len(validatedUserIDs) > 0 {
			initialStatus = models.ProjectStatusAssigned
		}
	}
	// Note: Area projects can be created without assignment now
	// Assignment can be done later via separate endpoint

	// Set area_id for area projects, nil for personal
	var projectAreaID *uint
	if req.ProjectType == models.ProjectTypeArea && userAreaID != nil {
		if areaID, ok := userAreaID.(*uint); ok && areaID != nil {
			projectAreaID = areaID
		}
	}

	// Set default priority if not provided
	priority := req.Priority
	if priority == "" {
		priority = models.ProjectPriorityMedium
	}

	// Parse dates from strings to time.Time
	var startDate, dueDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid start_date format. Use YYYY-MM-DD")
			return
		}
		startDate = &parsed
	}
	if req.DueDate != nil && *req.DueDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid due_date format. Use YYYY-MM-DD")
			return
		}
		dueDate = &parsed
	}

	project := models.Project{
		Name:              req.Name,
		Description:       req.Description,
		CreatedBy:         userID.(uint),
		AreaID:            projectAreaID,
		ProjectType:       req.ProjectType,
		Status:            initialStatus,
		Priority:          priority,
		EstimatedHours:    req.EstimatedHours,
		UsedHours:         0,
		RemainingHours:    req.EstimatedHours,
		CompletionPercent: 0,
		StartDate:         startDate,
		DueDate:           dueDate,
		IsActive:          true,
	}

	if err := config.DB.Create(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create project")
		return
	}

	// NUEVO: Asignar múltiples áreas si se proporcionaron
	if len(req.AreaIDs) > 0 {
		for _, areaID := range req.AreaIDs {
			// Verificar que el área existe
			var area models.Area
			if err := config.DB.First(&area, areaID).Error; err != nil {
				config.DB.Delete(&project) // Rollback
				utils.ErrorResponse(c, 404, "Area not found: "+strconv.FormatUint(uint64(areaID), 10))
				return
			}
			// Asociar área al proyecto
			if err := config.DB.Model(&project).Association("Areas").Append(&area); err != nil {
				config.DB.Delete(&project) // Rollback
				utils.ErrorResponse(c, 500, "Failed to associate areas")
				return
			}
		}
	} else if projectAreaID != nil {
		// Si no se proporcionaron AreaIDs pero hay projectAreaID (deprecated), asociar esa área
		var area models.Area
		if err := config.DB.First(&area, *projectAreaID).Error; err == nil {
			config.DB.Model(&project).Association("Areas").Append(&area)
		}
	}

	// Create assignments for all validated users
	currentUserID := userID.(uint)
	for _, assignedUserID := range validatedUserIDs {
		assignment := models.ProjectAssignment{
			ProjectID:  project.ID,
			UserID:     assignedUserID,
			AssignedBy: currentUserID,
			IsActive:   true,
			CanModify:  true,
		}
		if err := config.DB.Create(&assignment).Error; err != nil {
			// Log error but don't fail the project creation
			config.DB.Delete(&project) // Rollback
			utils.ErrorResponse(c, 500, "Failed to create project assignments")
			return
		}
	}

	// Reload to get relations including assigned users
	config.DB.Preload("Creator").Preload("AssignedUsers").Preload("ProjectAssignments.User").Preload("Area").First(&project, project.ID)

	utils.SuccessResponse(c, 201, "Project created successfully", project)
}

// UpdateProject godoc
// @Summary Update project
// @Description Update project information (Admin/SuperAdmin only)
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Param project body UpdateProjectRequest true "Project data"
// @Success 200 {object} utils.Response{data=models.Project}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /projects/{id} [put]
func UpdateProject(c *gin.Context) {
	id := c.Param("id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check permissions: only admin/superadmin can update
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can update projects")
		return
	}

	if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if project.AreaID == nil || *project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Can only update projects in your area")
			return
		}
	}

	// Merge single and multiple assignments for backward compatibility
	userIDsToAssign := req.AssignedUserIDs
	if req.AssignedUserID != nil {
		userIDsToAssign = append(userIDsToAssign, *req.AssignedUserID)
	}

	// Validate assigned users if provided
	var validatedUserIDs []uint
	if len(userIDsToAssign) > 0 {
		var adminAreaID *uint
		if role == models.RoleAdmin {
			areaID, ok := userAreaID.(*uint)
			if !ok || areaID == nil {
				utils.ErrorResponse(c, 403, "Admin must have an area assigned")
				return
			}
			adminAreaID = areaID
		}

		// Validate each user
		for _, userIDToAssign := range userIDsToAssign {
			var assignedUser models.User
			if err := config.DB.First(&assignedUser, userIDToAssign).Error; err != nil {
				utils.ErrorResponse(c, 404, "Assigned user not found: "+strconv.FormatUint(uint64(userIDToAssign), 10))
				return
			}

			// If admin, check that assigned user belongs to the same area
			if adminAreaID != nil {
				if assignedUser.AreaID == nil || *assignedUser.AreaID != *adminAreaID {
					utils.ErrorResponse(c, 403, "Can only assign users from your area")
					return
				}
			}

			validatedUserIDs = append(validatedUserIDs, userIDToAssign)
		}
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.EstimatedHours != nil {
		project.EstimatedHours = *req.EstimatedHours
		project.RemainingHours = *req.EstimatedHours - project.UsedHours
		if project.EstimatedHours > 0 {
			project.CompletionPercent = (project.UsedHours / project.EstimatedHours) * 100
		}
	}
	if req.Priority != nil {
		project.Priority = *req.Priority
	}
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid start_date format. Use YYYY-MM-DD")
			return
		}
		project.StartDate = &parsed
	}
	if req.DueDate != nil && *req.DueDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid due_date format. Use YYYY-MM-DD")
			return
		}
		project.DueDate = &parsed
	}
	if req.IsActive != nil {
		project.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update project")
		return
	}

	// Update assignments if provided
	if len(validatedUserIDs) > 0 {
		// Deactivate all current assignments
		config.DB.Model(&models.ProjectAssignment{}).
			Where("project_id = ?", project.ID).
			Update("is_active", false)

		// Create new assignments
		currentUserID := c.MustGet("user_id").(uint)
		for _, assignedUserID := range validatedUserIDs {
			// Check if assignment already exists
			var existingAssignment models.ProjectAssignment
			err := config.DB.Where("project_id = ? AND user_id = ?", project.ID, assignedUserID).
				First(&existingAssignment).Error

			if err == nil {
				// Reactivate existing assignment
				existingAssignment.IsActive = true
				existingAssignment.AssignedBy = currentUserID
				config.DB.Save(&existingAssignment)
			} else {
				// Create new assignment
				assignment := models.ProjectAssignment{
					ProjectID:  project.ID,
					UserID:     assignedUserID,
					AssignedBy: currentUserID,
					IsActive:   true,
					CanModify:  true,
				}
				config.DB.Create(&assignment)
			}
		}

		// Update project status
		if len(validatedUserIDs) > 0 {
			project.Status = models.ProjectStatusAssigned
			config.DB.Save(&project)
		}
	}

	// Reload to get relations including assigned users
	config.DB.Preload("Creator").Preload("AssignedUsers").Preload("ProjectAssignments.User").Preload("Area").First(&project, project.ID)

	utils.SuccessResponse(c, 200, "Project updated successfully", project)
}

// DeleteProject godoc
// @Summary Delete project
// @Description Soft delete a project (Admin/SuperAdmin only)
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /projects/{id} [delete]
func DeleteProject(c *gin.Context) {
	id := c.Param("id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check permissions: only admin/superadmin can delete
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can delete projects")
		return
	}

	if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if project.AreaID == nil || *project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Can only delete projects in your area")
			return
		}
	}

	if err := config.DB.Delete(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete project")
		return
	}

	utils.SuccessResponse(c, 200, "Project deleted successfully", nil)
}

// UpdateProjectStatus godoc
// @Summary Update project status
// @Description Update project status (drag & drop in backlog). Users can update their personal projects and assigned projects. Admins can update area projects.
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Param status body UpdateProjectStatusRequest true "New status"
// @Success 200 {object} utils.Response{data=models.Project}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /projects/{id}/status [patch]
func UpdateProjectStatus(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var req models.UpdateProjectStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	role := userRole.(models.Role)

	// Check permissions
	canUpdate := false
	if role == models.RoleSuperAdmin {
		canUpdate = true
	} else if role == models.RoleAdmin {
		// Admin can update area projects in their area
		if project.ProjectType == models.ProjectTypeArea {
			if areaID, ok := userAreaID.(*uint); ok && areaID != nil && project.AreaID != nil && *project.AreaID == *areaID {
				canUpdate = true
			}
		}
	} else if role == models.RoleUser {
		// User can update their own personal projects or projects assigned to them
		if project.CreatedBy == userID.(uint) && project.ProjectType == models.ProjectTypePersonal {
			canUpdate = true
		} else {
			var assignment models.ProjectAssignment
			err := config.DB.Where("project_id = ? AND user_id = ? AND is_active = ?", project.ID, userID.(uint), true).First(&assignment).Error
			if err == nil {
				canUpdate = true
			}
		}
	}

	if !canUpdate {
		utils.ErrorResponse(c, 403, "You don't have permission to update this project's status")
		return
	}

	// Update status
	project.Status = req.Status

	if err := config.DB.Save(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update project status")
		return
	}

	// Reload to get relations
	config.DB.Preload("Creator").Preload("AssignedUser").Preload("Area").First(&project, project.ID)

	utils.SuccessResponse(c, 200, "Project status updated successfully", project)
}
