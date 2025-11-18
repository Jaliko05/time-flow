package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID           uint         `json:"id"`
	Email        string       `json:"email"`
	FullName     string       `json:"full_name"`
	Role         models.Role  `json:"role"`
	AreaID       *uint        `json:"area_id"`
	Area         *models.Area `json:"area,omitempty"`
	WorkSchedule interface{}  `json:"work_schedule,omitempty"`
	LunchBreak   interface{}  `json:"lunch_break,omitempty"`
	IsActive     bool         `json:"is_active"`
}

// Login godoc
// @Summary Login user
// @Description Authenticate user with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var user models.User
	if err := config.DB.Preload("Area").Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		utils.ErrorResponse(c, 401, "Invalid email or password")
		return
	}

	if !user.CheckPassword(req.Password) {
		utils.ErrorResponse(c, 401, "Invalid email or password")
		return
	}

	token, err := utils.GenerateToken(&user)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate token")
		return
	}

	response := LoginResponse{
		Token: token,
		User: UserResponse{
			ID:           user.ID,
			Email:        user.Email,
			FullName:     user.FullName,
			Role:         user.Role,
			AreaID:       user.AreaID,
			Area:         user.Area,
			WorkSchedule: user.WorkSchedule,
			LunchBreak:   user.LunchBreak,
			IsActive:     user.IsActive,
		},
	}

	utils.SuccessResponse(c, 200, "Login successful", response)
}

// Me godoc
// @Summary Get current user
// @Description Get the authenticated user's information
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} UserResponse
// @Failure 401 {object} utils.Response
// @Router /auth/me [get]
func Me(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := config.DB.Preload("Area").First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	response := UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		FullName:     user.FullName,
		Role:         user.Role,
		AreaID:       user.AreaID,
		Area:         user.Area,
		WorkSchedule: user.WorkSchedule,
		LunchBreak:   user.LunchBreak,
		IsActive:     user.IsActive,
	}

	utils.SuccessResponse(c, 200, "User retrieved successfully", response)
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
	AreaID   *uint  `json:"area_id"`
}

// Register godoc
// @Summary Register new user
// @Description Public endpoint to register a new user account with role 'user'
// @Tags auth
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "Registration data"
// @Success 201 {object} utils.Response{data=models.User}
// @Failure 400 {object} utils.Response
// @Failure 500 {object} utils.Response
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
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
		Role:     models.RoleUser, // Force user role for public registration
		AreaID:   req.AreaID,
		IsActive: true,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create user")
		return
	}

	// Reload to get Area relation
	config.DB.Preload("Area").First(&user, user.ID)

	utils.SuccessResponse(c, 201, "User registered successfully", user)
}

type CreateSuperAdminRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

// CreateSuperAdmin godoc
// @Summary Create SuperAdmin
// @Description Create a new SuperAdmin user (SuperAdmin only)
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user body CreateSuperAdminRequest true "SuperAdmin data"
// @Success 201 {object} utils.Response{data=models.User}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /auth/superadmin [post]
func CreateSuperAdmin(c *gin.Context) {
	var req CreateSuperAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
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
		Role:     models.RoleSuperAdmin,
		AreaID:   nil,
		IsActive: true,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create superadmin")
		return
	}

	utils.SuccessResponse(c, 201, "SuperAdmin created successfully", user)
}
