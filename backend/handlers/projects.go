package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type CreateProjectRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateProjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

// GetProjects godoc
// @Summary Get projects
// @Description Get list of projects. Users see their own projects, Admins see their area's projects, SuperAdmins see all.
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param area_id query int false "Filter by area ID (SuperAdmin only)"
// @Param created_by query int false "Filter by creator user ID"
// @Param active query bool false "Filter by active status"
// @Success 200 {object} utils.Response{data=[]models.Project}
// @Failure 401 {object} utils.Response
// @Router /projects [get]
func GetProjects(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Preload("Creator").Preload("Area")

	// Apply filters based on role
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Regular users only see their own projects
		query = query.Where("created_by = ?", userID)
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

	if createdByStr := c.Query("created_by"); createdByStr != "" {
		if createdBy, err := strconv.ParseUint(createdByStr, 10, 32); err == nil {
			query = query.Where("created_by = ?", uint(createdBy))
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
	query := config.DB.Preload("Creator").Preload("Area")

	if err := query.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check access permissions
	role := userRole.(models.Role)
	if role == models.RoleUser && project.CreatedBy != userID.(uint) {
		utils.ErrorResponse(c, 403, "Access denied")
		return
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
// @Description Create a new project
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param project body CreateProjectRequest true "Project data"
// @Success 201 {object} utils.Response{data=models.Project}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Router /projects [post]
func CreateProject(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userAreaID, _ := c.Get("user_area_id")

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	project := models.Project{
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   userID.(uint),
		AreaID:      userAreaID.(*uint),
		IsActive:    true,
	}

	if err := config.DB.Create(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create project")
		return
	}

	// Reload to get relations
	config.DB.Preload("Creator").Preload("Area").First(&project, project.ID)

	utils.SuccessResponse(c, 201, "Project created successfully", project)
}

// UpdateProject godoc
// @Summary Update project
// @Description Update project information
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Param project body UpdateProjectRequest true "Project data"
// @Success 200 {object} utils.Response{data=models.Project}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /projects/{id} [put]
func UpdateProject(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

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

	// Check permissions: only creator or admin/superadmin can update
	role := userRole.(models.Role)
	if role == models.RoleUser && project.CreatedBy != userID.(uint) {
		utils.ErrorResponse(c, 403, "Only project creator can update")
		return
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.IsActive != nil {
		project.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update project")
		return
	}

	// Reload to get relations
	config.DB.Preload("Creator").Preload("Area").First(&project, project.ID)

	utils.SuccessResponse(c, 200, "Project updated successfully", project)
}

// DeleteProject godoc
// @Summary Delete project
// @Description Soft delete a project
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /projects/{id} [delete]
func DeleteProject(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check permissions
	role := userRole.(models.Role)
	if role == models.RoleUser && project.CreatedBy != userID.(uint) {
		utils.ErrorResponse(c, 403, "Only project creator can delete")
		return
	}

	if err := config.DB.Delete(&project).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete project")
		return
	}

	utils.SuccessResponse(c, 200, "Project deleted successfully", nil)
}
