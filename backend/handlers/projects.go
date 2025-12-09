package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type CreateProjectRequest struct {
	Name           string             `json:"name" binding:"required"`
	Description    string             `json:"description"`
	ProjectType    models.ProjectType `json:"project_type" binding:"required,oneof=personal area"` // personal o area
	AssignedUserID *uint              `json:"assigned_user_id"`                                    // Usuario al que se asigna (solo para proyectos de área)
	EstimatedHours float64            `json:"estimated_hours" binding:"required,gt=0"`             // Horas estimadas
}

type UpdateProjectRequest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	AssignedUserID *uint    `json:"assigned_user_id"`
	EstimatedHours *float64 `json:"estimated_hours" binding:"omitempty,gt=0"`
	IsActive       *bool    `json:"is_active"`
}

type UpdateProjectStatusRequest struct {
	Status models.ProjectStatus `json:"status" binding:"required,oneof=unassigned assigned in_progress paused completed"`
}

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

	query := config.DB.Preload("Creator").Preload("AssignedUser").Preload("Area")

	// Apply filters based on role
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Regular users see projects assigned to them (includes personal projects auto-assigned)
		query = query.Where("assigned_user_id = ?", userID)
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
			query = query.Where("assigned_user_id = ?", uint(assignedUserID))
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
	if err := query.Order("created_at DESC").Find(&projects).Error; err != nil {
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
	query := config.DB.Preload("Creator").Preload("AssignedUser").Preload("Area")

	if err := query.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check access permissions
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Users can only see projects assigned to them
		if project.AssignedUserID == nil || *project.AssignedUserID != userID.(uint) {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}
	if role == models.RoleAdmin {
		if userAreaID == nil || project.AreaID == nil || *project.AreaID != *userAreaID.(*uint) {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}

	utils.SuccessResponse(c, 200, "Project retrieved successfully", project)
}

// CreateProject godoc
// @Summary Create new project
// @Description Create a new project. Users and Admins can create personal projects. Admins can also create area projects and assign them to users in their area.
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

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	role := userRole.(models.Role)

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

		// If assigned user is specified, validate it belongs to the same area (for admin)
		if req.AssignedUserID != nil && role == models.RoleAdmin {
			var assignedUser models.User
			if err := config.DB.First(&assignedUser, req.AssignedUserID).Error; err != nil {
				utils.ErrorResponse(c, 404, "Assigned user not found")
				return
			}
			if assignedUser.AreaID != nil && *assignedUser.AreaID != *userAreaID.(*uint) {
				utils.ErrorResponse(c, 403, "Can only assign projects to users in your area")
				return
			}
		}
	}

	// Set initial status based on project type
	initialStatus := models.ProjectStatusUnassigned
	if req.ProjectType == models.ProjectTypePersonal {
		initialStatus = models.ProjectStatusInProgress // Personal projects start in progress
		// Personal projects are auto-assigned to their creator
		if req.AssignedUserID == nil {
			creatorID := userID.(uint)
			req.AssignedUserID = &creatorID
		}
	} else if req.AssignedUserID != nil {
		initialStatus = models.ProjectStatusAssigned // Area projects with assignment start as assigned
	}

	// Set area_id for area projects, nil for personal
	var projectAreaID *uint
	if req.ProjectType == models.ProjectTypeArea && userAreaID != nil {
		areaID := *userAreaID.(*uint)
		projectAreaID = &areaID
	}

	project := models.Project{
		Name:              req.Name,
		Description:       req.Description,
		CreatedBy:         userID.(uint),
		AreaID:            projectAreaID,
		ProjectType:       req.ProjectType,
		Status:            initialStatus,
		AssignedUserID:    req.AssignedUserID,
		EstimatedHours:    req.EstimatedHours,
		UsedHours:         0,
		RemainingHours:    req.EstimatedHours,
		CompletionPercent: 0,
		IsActive:          true,
	}

	if err := config.DB.Create(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create project")
		return
	}

	// Reload to get relations
	config.DB.Preload("Creator").Preload("AssignedUser").Preload("Area").First(&project, project.ID)

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

	var req UpdateProjectRequest
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
		if userAreaID == nil || project.AreaID == nil || *project.AreaID != *userAreaID.(*uint) {
			utils.ErrorResponse(c, 403, "Can only update projects in your area")
			return
		}
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.AssignedUserID != nil {
		project.AssignedUserID = req.AssignedUserID
	}
	if req.EstimatedHours != nil {
		project.EstimatedHours = *req.EstimatedHours
		project.RemainingHours = *req.EstimatedHours - project.UsedHours
		if project.EstimatedHours > 0 {
			project.CompletionPercent = (project.UsedHours / project.EstimatedHours) * 100
		}
	}
	if req.IsActive != nil {
		project.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update project")
		return
	}

	// Reload to get relations
	config.DB.Preload("Creator").Preload("AssignedUser").Preload("Area").First(&project, project.ID)

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
		if userAreaID == nil || project.AreaID == nil || *project.AreaID != *userAreaID.(*uint) {
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

	var req UpdateProjectStatusRequest
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
		if project.ProjectType == models.ProjectTypeArea && userAreaID != nil && project.AreaID != nil && *project.AreaID == *userAreaID.(*uint) {
			canUpdate = true
		}
	} else if role == models.RoleUser {
		// User can update their own personal projects or projects assigned to them
		if project.CreatedBy == userID.(uint) && project.ProjectType == models.ProjectTypePersonal {
			canUpdate = true
		} else if project.AssignedUserID != nil && *project.AssignedUserID == userID.(uint) {
			canUpdate = true
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
