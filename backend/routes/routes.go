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
			auth.POST("/microsoft", handlers.MicrosoftLogin)
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

			// NEW: Dashboard routes
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/superadmin", middleware.RequireRole(models.RoleSuperAdmin), handlers.GetSuperAdminDashboard)
				dashboard.GET("/admin", middleware.RequireRole(models.RoleAdmin), handlers.GetAdminDashboard)
				dashboard.GET("/user", middleware.RequireRole(models.RoleUser), handlers.GetUserDashboard)
			}

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

				// NEW: User workload and processes
				users.GET("/:id/workload", handlers.GetUserWorkload)
				users.GET("/:id/processes", handlers.GetUserProcesses)
			}

			// Project routes
			projects := protected.Group("/projects")
			{
				projects.GET("", handlers.GetProjects)
				projects.POST("", middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin), handlers.CreateProject)

				// NEW: Requirements and Incidents endpoints (MUST be before /:id routes)
				projects.GET("/:id/requirements", handlers.GetProjectRequirements)
				projects.GET("/:id/incidents", handlers.GetProjectIncidents)

				// Individual project routes (MUST be after nested routes)
				projects.GET("/:id", handlers.GetProject)
				projects.PUT("/:id", handlers.UpdateProject)
				projects.PATCH("/:id/status", handlers.UpdateProjectStatus)
				projects.DELETE("/:id", handlers.DeleteProject)
			}

			// NEW: Requirements routes
			requirements := protected.Group("/requirements")
			{
				requirements.GET("/:id", handlers.GetRequirement)
				requirements.POST("", middleware.CanManageRequirements(), handlers.CreateRequirement)
				requirements.PUT("/:id", middleware.CanManageRequirements(), handlers.UpdateRequirement)
				requirements.DELETE("/:id", middleware.CanManageRequirements(), handlers.DeleteRequirement)

				// Process creation for requirements
				requirements.POST("/:requirement_id/processes", middleware.CanManageProcesses(), handlers.CreateProcessForRequirement)
			}

			// NEW: Incidents routes
			incidents := protected.Group("/incidents")
			{
				incidents.GET("/:id", handlers.GetIncident)
				incidents.POST("", handlers.CreateIncident) // Any user can report incidents
				incidents.PUT("/:id", handlers.UpdateIncident)
				incidents.PUT("/:id/resolve", middleware.CanManageRequirements(), handlers.ResolveIncident)
				incidents.DELETE("/:id", middleware.CanManageRequirements(), handlers.DeleteIncident)

				// Process creation for incidents
				incidents.POST("/:incident_id/processes", handlers.CreateProcessForIncident)
			}

			// NEW: Processes routes
			processes := protected.Group("/processes")
			{
				// Nested routes MUST come before /:id routes
				processes.POST("/:id/assign", middleware.CanManageProcesses(), handlers.AssignUserToProcess)
				processes.DELETE("/:id/unassign/:user_id", middleware.CanManageProcesses(), handlers.RemoveUserFromProcess)
				processes.GET("/:id/assignments", handlers.GetProcessAssignments)
				processes.GET("/:id/activities", handlers.GetProcessActivities)
				processes.POST("/:id/activities", middleware.CanManageProcesses(), handlers.CreateProcessActivity)

				// Individual process routes (MUST be after nested routes)
				processes.GET("/:id", handlers.GetProcess)
				processes.PUT("/:id", middleware.CanManageProcesses(), handlers.UpdateProcess)
				processes.DELETE("/:id", middleware.CanManageProcesses(), handlers.DeleteProcess)
			}

			// NEW: Process Activities routes
			processActivities := protected.Group("/process-activities")
			{
				processActivities.PUT("/:id", handlers.UpdateProcessActivity)
				processActivities.GET("/:id/can-start", handlers.ValidateDependencies)
				processActivities.GET("/:id/dependency-chain", handlers.GetActivityDependencyChain)
				processActivities.GET("/:id/blocked", handlers.GetBlockedActivities)
			}

			// Activity routes (existing + new process creation)
			activities := protected.Group("/activities")
			{
				activities.GET("", handlers.GetActivities)
				activities.GET("/stats", handlers.GetActivityStats)
				activities.GET("/:id", handlers.GetActivity)
				activities.POST("", handlers.CreateActivity)
				activities.PUT("/:id", handlers.UpdateActivity)
				activities.DELETE("/:id", handlers.DeleteActivity)

				// NEW: Process creation for activities
				activities.POST("/:activity_id/processes", middleware.CanManageProcesses(), handlers.CreateProcessForActivity)
			}

			// Task routes
			tasks := protected.Group("/tasks")
			{
				tasks.GET("", handlers.GetTasks)
				tasks.GET("/:id", handlers.GetTask)
				tasks.POST("", handlers.CreateTask)
				tasks.PUT("/:id", handlers.UpdateTask)
				tasks.PATCH("/:id/status", handlers.UpdateTaskStatus)
				tasks.PATCH("/bulk-order", handlers.BulkUpdateTaskOrder)
				tasks.DELETE("/:id", handlers.DeleteTask)
			}

			// Comment routes
			comments := protected.Group("/comments")
			{
				comments.GET("", handlers.GetComments)
				comments.POST("", handlers.CreateComment)
				comments.PATCH("/:id", handlers.UpdateComment)
				comments.DELETE("/:id", handlers.DeleteComment)
			}

			// Stats routes (Admin and SuperAdmin only)
			stats := protected.Group("/stats")
			stats.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RoleAdmin))
			{
				stats.GET("/areas", handlers.GetAreasSummary)
				stats.GET("/users", handlers.GetUsersSummary)
				stats.GET("/projects", handlers.GetProjectsSummary)
			}

			// Calendar routes (cualquier usuario autenticado puede ver SU calendario)
			calendar := protected.Group("/calendar")
			{
				calendar.POST("/events", handlers.GetCalendarEvents)
				calendar.GET("/today", handlers.GetTodayCalendarEvents)
			}
		}
	}
}
