package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/handlers"
	"github.com/jaliko05/time-flow/middleware"
	"github.com/jaliko05/time-flow/models"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.Engine) {
	// CORS middleware
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		auth := v1.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/register", handlers.Register) // Public registration
		}

		// Public areas endpoint (for registration form)
		v1.GET("/areas", handlers.GetAreas)

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth routes
			protected.GET("/auth/me", handlers.Me)
			protected.POST("/auth/superadmin", middleware.RequireRole(models.RoleSuperAdmin), handlers.CreateSuperAdmin)

			// Area routes (management - SuperAdmin only)
			areas := protected.Group("/areas")
			{
				areas.GET("/:id", handlers.GetArea)

				// SuperAdmin only
				areas.POST("", middleware.RequireRole(models.RoleSuperAdmin), handlers.CreateArea)
				areas.PUT("/:id", middleware.RequireRole(models.RoleSuperAdmin), handlers.UpdateArea)
				areas.DELETE("/:id", middleware.RequireRole(models.RoleSuperAdmin), handlers.DeleteArea)
			}

			// User routes
			users := protected.Group("/users")
			{
				users.GET("", middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin), handlers.GetUsers)
				users.GET("/:id", middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin), handlers.GetUser)
				users.POST("", middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin), handlers.CreateUser)
				users.PUT("/:id", middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin), handlers.UpdateUser)
				users.DELETE("/:id", middleware.RequireRole(models.RoleSuperAdmin), handlers.DeleteUser)
			}

			// Project routes
			projects := protected.Group("/projects")
			{
				projects.GET("", handlers.GetProjects)
				projects.GET("/:id", handlers.GetProject)
				projects.POST("", handlers.CreateProject)
				projects.PUT("/:id", handlers.UpdateProject)
				projects.DELETE("/:id", handlers.DeleteProject)
			}

			// Activity routes
			activities := protected.Group("/activities")
			{
				activities.GET("", handlers.GetActivities)
				activities.GET("/stats", handlers.GetActivityStats)
				activities.GET("/:id", handlers.GetActivity)
				activities.POST("", handlers.CreateActivity)
				activities.PUT("/:id", handlers.UpdateActivity)
				activities.DELETE("/:id", handlers.DeleteActivity)
			}
		}
	}
}
