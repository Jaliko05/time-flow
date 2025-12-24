package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// GetProjectRequirements godoc
// @Summary Get requirements for a project
// @Description Get list of requirements for a specific project
// @Tags requirements
// @Produce json
// @Security BearerAuth
// @Param project_id path int true "Project ID"
// @Param status query string false "Filter by status"
// @Param priority query string false "Filter by priority"
// @Success 200 {object} utils.Response{data=[]models.Requirement}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /projects/{id}/requirements [get]
func GetProjectRequirements(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid project ID")
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Verificar acceso al proyecto
	var project models.Project
	if err := config.DB.First(&project, uint(projectID)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Verificar permisos
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Usuario debe estar asignado al proyecto
		var count int64
		config.DB.Model(&models.ProjectAssignment{}).
			Where("project_id = ? AND user_id = ? AND is_active = ?", uint(projectID), userID, true).
			Count(&count)
		if count == 0 {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}

	// Construir query
	query := config.DB.Preload("Creator").Preload("Processes").Where("project_id = ?", uint(projectID))

	// Filtros opcionales
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}

	var requirements []models.Requirement
	if err := query.Find(&requirements).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch requirements")
		return
	}

	utils.SuccessResponse(c, 200, "Requirements retrieved successfully", requirements)
}

// GetRequirement godoc
// @Summary Get requirement details
// @Description Get detailed information about a specific requirement
// @Tags requirements
// @Produce json
// @Security BearerAuth
// @Param id path int true "Requirement ID"
// @Success 200 {object} utils.Response{data=models.Requirement}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /requirements/{id} [get]
func GetRequirement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid requirement ID")
		return
	}

	var requirement models.Requirement
	if err := config.DB.Preload("Project").
		Preload("Creator").
		Preload("Processes").
		Preload("Processes.Assignments").
		First(&requirement, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Requirement not found")
		return
	}

	utils.SuccessResponse(c, 200, "Requirement retrieved successfully", requirement)
}

// CreateRequirement godoc
// @Summary Create new requirement
// @Description Create a new requirement for a project (Admin/SuperAdmin only)
// @Tags requirements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param requirement body CreateRequirementRequest true "Requirement data"
// @Success 201 {object} utils.Response{data=models.Requirement}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /requirements [post]
func CreateRequirement(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Solo Admin y SuperAdmin pueden crear requerimientos
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can create requirements")
		return
	}

	type CreateRequirementRequest struct {
		ProjectID   uint   `json:"project_id" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Status      string `json:"status"`
		Priority    string `json:"priority"`
	}

	var req CreateRequirementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Verificar que el proyecto existe
	var project models.Project
	if err := config.DB.First(&project, req.ProjectID).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Admin solo puede crear en proyectos de su área
	if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only create requirements for projects in your area")
				return
			}
		}
	}

	// Crear requerimiento
	requirement := models.Requirement{
		ProjectID:   req.ProjectID,
		Name:        req.Name,
		Description: req.Description,
		Status:      models.RequirementStatus(req.Status),
		Priority:    models.Priority(req.Priority),
		CreatedBy:   userID.(uint),
	}

	// Si no se proporciona status o priority, usar defaults
	if requirement.Status == "" {
		requirement.Status = models.RequirementStatusPending
	}
	if requirement.Priority == "" {
		requirement.Priority = models.PriorityMedium
	}

	if err := config.DB.Create(&requirement).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create requirement: "+err.Error())
		return
	}

	// Cargar relaciones
	config.DB.Preload("Creator").Preload("Project").First(&requirement, requirement.ID)

	utils.SuccessResponse(c, 201, "Requirement created successfully", requirement)
}

// UpdateRequirement godoc
// @Summary Update requirement
// @Description Update an existing requirement (Admin/SuperAdmin only)
// @Tags requirements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Requirement ID"
// @Param requirement body UpdateRequirementRequest true "Updated requirement data"
// @Success 200 {object} utils.Response{data=models.Requirement}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /requirements/{id} [put]
func UpdateRequirement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid requirement ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can update requirements")
		return
	}

	type UpdateRequirementRequest struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Status      *string `json:"status"`
		Priority    *string `json:"priority"`
	}

	var req UpdateRequirementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var requirement models.Requirement
	if err := config.DB.Preload("Project").First(&requirement, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Requirement not found")
		return
	}

	// Admin solo puede actualizar requerimientos de proyectos de su área
	if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && requirement.Project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *requirement.Project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only update requirements for projects in your area")
				return
			}
		}
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
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	updates["updated_at"] = time.Now()

	if err := config.DB.Model(&requirement).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update requirement")
		return
	}

	// Recargar con relaciones
	config.DB.Preload("Creator").Preload("Project").Preload("Processes").First(&requirement, uint(id))

	utils.SuccessResponse(c, 200, "Requirement updated successfully", requirement)
}

// DeleteRequirement godoc
// @Summary Delete requirement
// @Description Soft delete a requirement (Admin/SuperAdmin only)
// @Tags requirements
// @Produce json
// @Security BearerAuth
// @Param id path int true "Requirement ID"
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /requirements/{id} [delete]
func DeleteRequirement(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid requirement ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can delete requirements")
		return
	}

	var requirement models.Requirement
	if err := config.DB.Preload("Project").First(&requirement, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Requirement not found")
		return
	}

	// Admin solo puede eliminar requerimientos de proyectos de su área
	if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && requirement.Project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *requirement.Project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only delete requirements for projects in your area")
				return
			}
		}
	}

	if err := config.DB.Delete(&requirement).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete requirement")
		return
	}

	utils.SuccessResponse(c, 200, "Requirement deleted successfully", gin.H{"message": "Requirement deleted successfully"})
}
