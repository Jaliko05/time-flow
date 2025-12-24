package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// GetProjectIncidents godoc
// @Summary Get incidents for a project
// @Description Get list of incidents for a specific project
// @Tags incidents
// @Produce json
// @Security BearerAuth
// @Param id path int true "Project ID"
// @Param status query string false "Filter by status"
// @Param severity query string false "Filter by severity"
// @Success 200 {object} utils.Response{data=[]models.Incident}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /projects/{id}/incidents [get]
func GetProjectIncidents(c *gin.Context) {
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
	query := config.DB.Preload("Reporter").
		Preload("Resolver").
		Preload("Processes").
		Where("project_id = ?", uint(projectID))

	// Filtros opcionales
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if severity := c.Query("severity"); severity != "" {
		query = query.Where("severity = ?", severity)
	}

	var incidents []models.Incident
	if err := query.Order("created_at DESC").Find(&incidents).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch incidents")
		return
	}

	utils.SuccessResponse(c, 200, "Incidents retrieved successfully", incidents)
}

// GetIncident godoc
// @Summary Get incident details
// @Description Get detailed information about a specific incident
// @Tags incidents
// @Produce json
// @Security BearerAuth
// @Param id path int true "Incident ID"
// @Success 200 {object} utils.Response{data=models.Incident}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /incidents/{id} [get]
func GetIncident(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid incident ID")
		return
	}

	var incident models.Incident
	if err := config.DB.Preload("Project").
		Preload("Reporter").
		Preload("Resolver").
		Preload("Processes").
		Preload("Processes.AssignedUsers").
		Preload("Processes.Activities").
		First(&incident, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Incident not found")
		return
	}

	utils.SuccessResponse(c, 200, "Incident retrieved successfully", incident)
}

// CreateIncident godoc
// @Summary Report new incident
// @Description Report a new incident for a project (any user assigned to project)
// @Tags incidents
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param incident body CreateIncidentRequest true "Incident data"
// @Success 201 {object} utils.Response{data=models.Incident}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /incidents [post]
func CreateIncident(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	type CreateIncidentRequest struct {
		ProjectID   uint   `json:"project_id" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Description string `json:"description" binding:"required"`
		Severity    string `json:"severity"`
		Status      string `json:"status"`
	}

	var req CreateIncidentRequest
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

	// Verificar acceso al proyecto
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Usuario debe estar asignado al proyecto para reportar incidentes
		var count int64
		config.DB.Model(&models.ProjectAssignment{}).
			Where("project_id = ? AND user_id = ? AND is_active = ?", req.ProjectID, userID, true).
			Count(&count)
		if count == 0 {
			utils.ErrorResponse(c, 403, "You must be assigned to the project to report incidents")
			return
		}
	} else if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only report incidents for projects in your area")
				return
			}
		}
	}

	// Crear incidente
	incident := models.Incident{
		ProjectID:   req.ProjectID,
		Name:        req.Name,
		Description: req.Description,
		Severity:    models.IncidentSeverity(req.Severity),
		Status:      models.IncidentStatus(req.Status),
		ReportedBy:  userID.(uint),
	}

	// Defaults
	if incident.Severity == "" {
		incident.Severity = models.IncidentSeverityMedium
	}
	if incident.Status == "" {
		incident.Status = models.IncidentStatusOpen
	}

	if err := config.DB.Create(&incident).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create incident: "+err.Error())
		return
	}

	// Cargar relaciones
	config.DB.Preload("Reporter").Preload("Project").First(&incident, incident.ID)

	utils.SuccessResponse(c, 201, "Incident created successfully", incident)
}

// UpdateIncident godoc
// @Summary Update incident
// @Description Update an existing incident
// @Tags incidents
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Incident ID"
// @Param incident body UpdateIncidentRequest true "Updated incident data"
// @Success 200 {object} utils.Response{data=models.Incident}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /incidents/{id} [put]
func UpdateIncident(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid incident ID")
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	type UpdateIncidentRequest struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Severity    *string `json:"severity"`
		Status      *string `json:"status"`
	}

	var req UpdateIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var incident models.Incident
	if err := config.DB.Preload("Project").First(&incident, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Incident not found")
		return
	}

	// Verificar permisos
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Usuario solo puede actualizar si es el reportero o está asignado al proyecto
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
				utils.ErrorResponse(c, 403, "Can only update incidents for projects in your area")
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
	if req.Severity != nil {
		updates["severity"] = *req.Severity
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	updates["updated_at"] = time.Now()

	if err := config.DB.Model(&incident).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update incident")
		return
	}

	// Recargar con relaciones
	config.DB.Preload("Reporter").Preload("Resolver").Preload("Project").Preload("Processes").First(&incident, uint(id))

	utils.SuccessResponse(c, 200, "Incident updated successfully", incident)
}

// ResolveIncident godoc
// @Summary Resolve incident
// @Description Mark an incident as resolved (Admin/SuperAdmin only)
// @Tags incidents
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Incident ID"
// @Success 200 {object} utils.Response{data=models.Incident}
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /incidents/{id}/resolve [put]
func ResolveIncident(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid incident ID")
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can resolve incidents")
		return
	}

	var incident models.Incident
	if err := config.DB.Preload("Project").First(&incident, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Incident not found")
		return
	}

	// Admin solo puede resolver incidentes de proyectos de su área
	if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && incident.Project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *incident.Project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only resolve incidents for projects in your area")
				return
			}
		}
	}

	// Marcar como resuelto
	now := time.Now()
	resolverID := userID.(uint)
	updates := map[string]interface{}{
		"status":      models.IncidentStatusResolved,
		"resolved_by": resolverID,
		"resolved_at": &now,
		"updated_at":  now,
	}

	if err := config.DB.Model(&incident).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to resolve incident")
		return
	}

	// Recargar con relaciones
	config.DB.Preload("Reporter").Preload("Resolver").Preload("Project").First(&incident, uint(id))

	utils.SuccessResponse(c, 200, "Incident resolved successfully", incident)
}

// DeleteIncident godoc
// @Summary Delete incident
// @Description Soft delete an incident (Admin/SuperAdmin only)
// @Tags incidents
// @Produce json
// @Security BearerAuth
// @Param id path int true "Incident ID"
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /incidents/{id} [delete]
func DeleteIncident(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid incident ID")
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(models.Role)
	if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only admins can delete incidents")
		return
	}

	var incident models.Incident
	if err := config.DB.Preload("Project").First(&incident, uint(id)).Error; err != nil {
		utils.ErrorResponse(c, 404, "Incident not found")
		return
	}

	// Admin solo puede eliminar incidentes de proyectos de su área
	if role == models.RoleAdmin {
		userAreaID, _ := c.Get("user_area_id")
		if userAreaID != nil && incident.Project.AreaID != nil {
			areaID, ok := userAreaID.(*uint)
			if ok && areaID != nil && *incident.Project.AreaID != *areaID {
				utils.ErrorResponse(c, 403, "Can only delete incidents for projects in your area")
				return
			}
		}
	}

	if err := config.DB.Delete(&incident).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete incident")
		return
	}

	utils.SuccessResponse(c, 200, "Incident deleted successfully", gin.H{"deleted": true})
}
