package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// RequireRole middleware checks if user has required role
func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.ErrorResponse(c, 403, "User role not found")
			c.Abort()
			return
		}

		role := userRole.(models.Role)
		for _, r := range roles {
			if role == r {
				c.Next()
				return
			}
		}

		utils.ErrorResponse(c, 403, "Insufficient permissions")
		c.Abort()
	}
}

// RequireAreaAccess middleware checks if user has access to the requested area
func RequireAreaAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, _ := c.Get("user_role")
		role := userRole.(models.Role)

		// SuperAdmin has access to everything
		if role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		// Admin and AdminArea can only access their area
		if role == models.RoleAdmin {
			userAreaID, exists := c.Get("user_area_id")
			if !exists || userAreaID == nil {
				utils.ErrorResponse(c, 403, "Area not assigned")
				c.Abort()
				return
			}
			// Area validation will be done in handlers when needed
			c.Next()
			return
		}

		utils.ErrorResponse(c, 403, "Insufficient permissions")
		c.Abort()
	}
}

// CanCreateProject middleware checks if user can create projects
// Only Admin and SuperAdmin can create projects
func CanCreateProject() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.ErrorResponse(c, 403, "User role not found")
			c.Abort()
			return
		}

		role := userRole.(models.Role)
		if role == models.RoleAdmin || role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		utils.ErrorResponse(c, 403, "Only admins and super admins can create projects")
		c.Abort()
	}
}

// CanManageRequirements middleware checks if user can manage requirements
// Only Admin and SuperAdmin can manage requirements
func CanManageRequirements() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.ErrorResponse(c, 403, "User role not found")
			c.Abort()
			return
		}

		role := userRole.(models.Role)
		if role == models.RoleAdmin || role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		utils.ErrorResponse(c, 403, "Only admins can manage requirements")
		c.Abort()
	}
}

// CanManageProcesses middleware checks if user can manage processes
// Only Admin and SuperAdmin can create/update/delete processes
func CanManageProcesses() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.ErrorResponse(c, 403, "User role not found")
			c.Abort()
			return
		}

		role := userRole.(models.Role)
		if role == models.RoleAdmin || role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		utils.ErrorResponse(c, 403, "Only admins can manage processes")
		c.Abort()
	}
}
