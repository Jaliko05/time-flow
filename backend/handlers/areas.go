package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type CreateAreaRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateAreaRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

// GetAreas godoc
// @Summary Get all areas
// @Description Get list of all areas (public endpoint, also accessible with authentication)
// @Tags areas
// @Produce json
// @Param active query bool false "Filter by active status"
// @Success 200 {object} utils.Response{data=[]models.Area}
// @Failure 500 {object} utils.Response
// @Router /areas [get]
func GetAreas(c *gin.Context) {
	query := config.DB.Model(&models.Area{})

	// Optional filter by active status
	if activeStr := c.Query("active"); activeStr != "" {
		if activeStr == "true" {
			query = query.Where("is_active = ?", true)
		} else if activeStr == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	var areas []models.Area
	if err := query.Find(&areas).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve areas")
		return
	}

	utils.SuccessResponse(c, 200, "Areas retrieved successfully", areas)
}

// GetArea godoc
// @Summary Get area by ID
// @Description Get a specific area with its users
// @Tags areas
// @Produce json
// @Security BearerAuth
// @Param id path int true "Area ID"
// @Success 200 {object} utils.Response{data=models.Area}
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /areas/{id} [get]
func GetArea(c *gin.Context) {
	id := c.Param("id")

	var area models.Area
	if err := config.DB.Preload("Users").First(&area, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Area not found")
		return
	}

	utils.SuccessResponse(c, 200, "Area retrieved successfully", area)
}

// CreateArea godoc
// @Summary Create new area
// @Description Create a new area (SuperAdmin only)
// @Tags areas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param area body CreateAreaRequest true "Area data"
// @Success 201 {object} utils.Response{data=models.Area}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /areas [post]
func CreateArea(c *gin.Context) {
	var req CreateAreaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Check if area name already exists
	var existingArea models.Area
	if err := config.DB.Where("name = ?", req.Name).First(&existingArea).Error; err == nil {
		utils.ErrorResponse(c, 400, "Area name already exists")
		return
	}

	area := models.Area{
		Name:        req.Name,
		Description: req.Description,
		IsActive:    true,
	}

	if err := config.DB.Create(&area).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create area")
		return
	}

	utils.SuccessResponse(c, 201, "Area created successfully", area)
}

// UpdateArea godoc
// @Summary Update area
// @Description Update area information (SuperAdmin only)
// @Tags areas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Area ID"
// @Param area body UpdateAreaRequest true "Area data"
// @Success 200 {object} utils.Response{data=models.Area}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /areas/{id} [put]
func UpdateArea(c *gin.Context) {
	id := c.Param("id")

	var req UpdateAreaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var area models.Area
	if err := config.DB.First(&area, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Area not found")
		return
	}

	// Update fields
	if req.Name != "" {
		area.Name = req.Name
	}
	if req.Description != "" {
		area.Description = req.Description
	}
	if req.IsActive != nil {
		area.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&area).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update area")
		return
	}

	utils.SuccessResponse(c, 200, "Area updated successfully", area)
}

// DeleteArea godoc
// @Summary Delete area
// @Description Soft delete an area (SuperAdmin only)
// @Tags areas
// @Produce json
// @Security BearerAuth
// @Param id path int true "Area ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /areas/{id} [delete]
func DeleteArea(c *gin.Context) {
	id := c.Param("id")

	var area models.Area
	if err := config.DB.First(&area, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Area not found")
		return
	}

	// Check if area has users
	var userCount int64
	config.DB.Model(&models.User{}).Where("area_id = ?", id).Count(&userCount)
	if userCount > 0 {
		utils.ErrorResponse(c, 400, "Cannot delete area with active users")
		return
	}

	if err := config.DB.Delete(&area).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete area")
		return
	}

	utils.SuccessResponse(c, 200, "Area deleted successfully", nil)
}
