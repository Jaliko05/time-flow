package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/services"
	"github.com/jaliko05/time-flow/utils"
)

// GetSuperAdminDashboard godoc
// @Summary Get SuperAdmin dashboard metrics
// @Description Get global metrics for SuperAdmin dashboard (all areas, projects, users)
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response{data=services.SuperAdminMetrics}
// @Failure 403 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /dashboard/superadmin [get]
func GetSuperAdminDashboard(c *gin.Context) {
	// Verificar que el usuario sea SuperAdmin
	userRole, exists := c.Get("user_role")
	if !exists {
		utils.ErrorResponse(c, 401, "Unauthorized")
		return
	}

	role := userRole.(models.Role)
	if role != models.RoleSuperAdmin {
		utils.ErrorResponse(c, 403, "Only SuperAdmin can access global dashboard")
		return
	}

	// Obtener métricas del servicio
	metricsService := services.NewMetricsService()
	metrics, err := metricsService.GetSuperAdminMetrics()
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve dashboard metrics: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 200, "SuperAdmin dashboard metrics retrieved successfully", metrics)
}

// GetAdminDashboard godoc
// @Summary Get Admin dashboard metrics
// @Description Get metrics for Admin dashboard (specific area)
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response{data=services.AdminMetrics}
// @Failure 403 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /dashboard/admin [get]
func GetAdminDashboard(c *gin.Context) {
	// Verificar que el usuario sea Admin
	userRole, exists := c.Get("user_role")
	if !exists {
		utils.ErrorResponse(c, 401, "Unauthorized")
		return
	}

	role := userRole.(models.Role)
	if role != models.RoleAdmin {
		utils.ErrorResponse(c, 403, "Only Admin can access area dashboard")
		return
	}

	// Obtener el área del usuario
	userAreaID, exists := c.Get("user_area_id")
	if !exists {
		utils.ErrorResponse(c, 400, "User area not found")
		return
	}

	areaID := userAreaID.(uint)

	// Obtener métricas del servicio
	metricsService := services.NewMetricsService()
	metrics, err := metricsService.GetAdminMetrics(areaID)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve dashboard metrics: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 200, "Admin dashboard metrics retrieved successfully", metrics)
}

// GetUserDashboard godoc
// @Summary Get User dashboard metrics
// @Description Get metrics for User dashboard (personal stats and assigned projects)
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} utils.Response{data=services.UserMetrics}
// @Failure 403 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /dashboard/user [get]
func GetUserDashboard(c *gin.Context) {
	// Verificar que el usuario sea User
	userRole, exists := c.Get("user_role")
	if !exists {
		utils.ErrorResponse(c, 401, "Unauthorized")
		return
	}

	role := userRole.(models.Role)
	if role != models.RoleUser {
		utils.ErrorResponse(c, 403, "Only regular users can access this dashboard")
		return
	}

	// Obtener el ID del usuario
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, 400, "User ID not found")
		return
	}

	id := userID.(uint)

	// Obtener métricas del servicio
	metricsService := services.NewMetricsService()
	metrics, err := metricsService.GetUserMetrics(id)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve dashboard metrics: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 200, "User dashboard metrics retrieved successfully", metrics)
}
