package handlers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

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
	var req models.LoginRequest
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

	response := models.LoginResponse{
		Token: token,
		User: models.UserResponse{
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

// MicrosoftLogin godoc
// @Summary Login with Microsoft
// @Description Authenticate user with Microsoft access token
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body MicrosoftLoginRequest true "Microsoft access token"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Router /auth/microsoft [post]
func MicrosoftLogin(c *gin.Context) {
	var req models.MicrosoftLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Validate Microsoft token and get user info
	msUserInfo, err := utils.ValidateMicrosoftToken(req.AccessToken)
	if err != nil {
		utils.ErrorResponse(c, 401, "Invalid Microsoft token: "+err.Error())
		return
	}

	// Look for existing user by Microsoft ID or email
	var user models.User
	result := config.DB.Preload("Area").Where("microsoft_id = ? OR (email = ? AND auth_provider = ?)",
		msUserInfo.ID, msUserInfo.Mail, "microsoft").First(&user)

	if result.Error != nil {
		// User doesn't exist, create new user
		fullName := msUserInfo.DisplayName
		if fullName == "" {
			fullName = msUserInfo.GivenName + " " + msUserInfo.Surname
		}

		user = models.User{
			Email:                msUserInfo.Mail,
			FullName:             fullName,
			Role:                 models.RoleUser, // Default role
			MicrosoftID:          &msUserInfo.ID,
			MicrosoftAccessToken: &req.AccessToken,
			AuthProvider:         "microsoft",
			IsActive:             false, // Pending SuperAdmin approval
		}

		if err := config.DB.Create(&user).Error; err != nil {
			utils.ErrorResponse(c, 500, "Failed to create user")
			return
		}

		// Reload to get Area relation
		config.DB.Preload("Area").First(&user, user.ID)

		// Return special response for pending approval
		utils.SuccessResponse(c, 202, "Account created. Waiting for administrator approval", gin.H{
			"user": models.UserResponse{
				ID:       user.ID,
				Email:    user.Email,
				FullName: user.FullName,
				Role:     user.Role,
				IsActive: user.IsActive,
			},
			"pending_approval": true,
		})
		return
	} else {
		// User exists, check if active
		if !user.IsActive {
			utils.ErrorResponse(c, 401, "User account is inactive")
			return
		}

		// Update Microsoft ID and token if needed
		if user.MicrosoftID == nil || *user.MicrosoftID == "" {
			user.MicrosoftID = &msUserInfo.ID
		}
		// Always update the access token on login
		user.MicrosoftAccessToken = &req.AccessToken
		user.AuthProvider = "microsoft"

		log.Printf("Updating user %d with Microsoft token (length: %d)", user.ID, len(req.AccessToken))

		// Save with specific fields to ensure update
		if err := config.DB.Model(&user).Updates(map[string]interface{}{
			"microsoft_id":           user.MicrosoftID,
			"microsoft_access_token": user.MicrosoftAccessToken,
			"auth_provider":          user.AuthProvider,
		}).Error; err != nil {
			log.Printf("Error updating user token: %v", err)
			utils.ErrorResponse(c, 500, "Failed to update user token")
			return
		}

		log.Printf("Successfully updated user %d Microsoft token", user.ID)
	}

	// Generate JWT token
	token, err := utils.GenerateToken(&user)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate token")
		return
	}

	response := models.LoginResponse{
		Token: token,
		User: models.UserResponse{
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

	response := models.UserResponse{
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
	var req models.RegisterRequest
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
	var req models.CreateSuperAdminRequest
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
