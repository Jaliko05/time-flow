package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// GetUsers godoc
// @Summary Get all users
// @Description Get list of users with optional area filter. Admins see only their area, SuperAdmins see all.
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param area_id query int false "Filter by area ID"
// @Success 200 {object} utils.Response{data=[]models.User}
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /users [get]
func GetUsers(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Preload("Area")

	// Apply area filter based on role
	if userRole == models.RoleAdmin {
		if userAreaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		query = query.Where("area_id = ?", userAreaID)
	} else if userRole == models.RoleSuperAdmin {
		// SuperAdmin can optionally filter by area
		if areaIDStr := c.Query("area_id"); areaIDStr != "" {
			if areaID, err := strconv.ParseUint(areaIDStr, 10, 32); err == nil {
				query = query.Where("area_id = ?", uint(areaID))
			}
		}
	}

	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve users")
		return
	}

	utils.SuccessResponse(c, 200, "Users retrieved successfully", users)
}

// GetUser godoc
// @Summary Get user by ID
// @Description Get a specific user's information
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} utils.Response{data=models.User}
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /users/{id} [get]
func GetUser(c *gin.Context) {
	id := c.Param("id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var user models.User
	query := config.DB.Preload("Area")

	// Admin can only see users in their area
	if userRole == models.RoleAdmin {
		if userAreaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		query = query.Where("area_id = ?", userAreaID)
	}

	if err := query.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	utils.SuccessResponse(c, 200, "User retrieved successfully", user)
}

// CreateUser godoc
// @Summary Create new user
// @Description Create a new user. SuperAdmin can create any role in any area. Admin can only create 'user' role in their own area.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user body CreateUserRequest true "User data - SuperAdmin can set any role (user/admin/superadmin), Admin can only create role 'user'"
// @Success 201 {object} utils.Response{data=models.User}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /users [post]
func CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	userRole, roleExists := c.Get("user_role")
	if !roleExists {
		utils.ErrorResponse(c, 401, "Authentication required")
		return
	}

	userAreaID, _ := c.Get("user_area_id")

	// Validate role permissions
	if userRole == models.RoleAdmin {
		// Admin can only create users in their area and only with role 'user'
		if req.Role != models.RoleUser {
			utils.ErrorResponse(c, 403, "Admin can only create users with 'user' role")
			return
		}
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil || req.AreaID == nil || *req.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Admin can only create users in their area")
			return
		}
	}

	// Check if email already exists
	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, 400, "Email already exists")
		return
	}

	user := models.User{
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		Role:     req.Role,
		AreaID:   req.AreaID,
		IsActive: true,
	}

	// Handle JSON fields
	if req.WorkSchedule != nil {
		if err := config.DB.Model(&user).Update("work_schedule", req.WorkSchedule).Error; err == nil {
			user.WorkSchedule = nil // Will be set by GORM
		}
	}
	if req.LunchBreak != nil {
		if err := config.DB.Model(&user).Update("lunch_break", req.LunchBreak).Error; err == nil {
			user.LunchBreak = nil // Will be set by GORM
		}
	}

	if err := config.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create user")
		return
	}

	// Reload to get Area relation
	config.DB.Preload("Area").First(&user, user.ID)

	utils.SuccessResponse(c, 201, "User created successfully", user)
}

// UpdateUser godoc
// @Summary Update user
// @Description Update user information
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Param user body UpdateUserRequest true "User data"
// @Success 200 {object} utils.Response{data=models.User}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /users/{id} [put]
func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	// Admin can only update users in their area
	if userRole == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if user.AreaID == nil || *user.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Cannot update users from other areas")
			return
		}
		// Admin cannot change role
		if req.Role != "" && req.Role != user.Role {
			utils.ErrorResponse(c, 403, "Admin cannot change user roles")
			return
		}
	}

	// Update fields
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Password != "" {
		user.Password = req.Password // Will be hashed by BeforeUpdate hook
	}
	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.AreaID != nil {
		user.AreaID = req.AreaID
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	// Handle JSON fields separately
	updates := make(map[string]interface{})
	if req.WorkSchedule != nil {
		updates["work_schedule"] = req.WorkSchedule
	}
	if req.LunchBreak != nil {
		updates["lunch_break"] = req.LunchBreak
	}

	if err := config.DB.Model(&user).Updates(updates).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update JSON fields")
		return
	}

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update user")
		return
	}

	// Reload to get Area relation
	config.DB.Preload("Area").First(&user, user.ID)

	utils.SuccessResponse(c, 200, "User updated successfully", user)
}

// DeleteUser godoc
// @Summary Delete user
// @Description Soft delete a user (SuperAdmin only)
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /users/{id} [delete]
func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete user")
		return
	}

	utils.SuccessResponse(c, 200, "User deleted successfully", nil)
}
