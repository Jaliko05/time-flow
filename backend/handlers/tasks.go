package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

// GetTasks godoc
// @Summary Get tasks
// @Description Get list of tasks. Users see their assigned tasks, Admins see their area's tasks, SuperAdmins see all.
// @Tags tasks
// @Produce json
// @Security BearerAuth
// @Param project_id query int false "Filter by project ID"
// @Param assigned_user_id query int false "Filter by assigned user ID"
// @Param status query string false "Filter by status"
// @Param priority query string false "Filter by priority"
// @Success 200 {object} utils.Response{data=[]models.Task}
// @Failure 401 {object} utils.Response
// @Router /tasks [get]
func GetTasks(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Preload("Project").Preload("Project.Area").Preload("AssignedUser").Preload("Creator")

	role := userRole.(models.Role)

	// Apply role-based filters
	if role == models.RoleUser {
		// Regular users only see tasks assigned to them or unassigned tasks from their projects
		query = query.Where("assigned_user_id = ? OR (assigned_user_id IS NULL AND project_id IN (SELECT id FROM projects WHERE assigned_user_id = ?))", userID, userID)
	} else if role == models.RoleAdmin {
		// Admins see tasks from projects in their area
		if userAreaID != nil {
			query = query.Joins("JOIN projects ON tasks.project_id = projects.id").
				Where("projects.area_id = ?", userAreaID)
		}
	}
	// SuperAdmin sees all tasks

	// Apply query filters
	if projectIDStr := c.Query("project_id"); projectIDStr != "" {
		if projectID, err := strconv.ParseUint(projectIDStr, 10, 32); err == nil {
			query = query.Where("project_id = ?", uint(projectID))
		}
	}

	if assignedUserIDStr := c.Query("assigned_user_id"); assignedUserIDStr != "" {
		if assignedUserID, err := strconv.ParseUint(assignedUserIDStr, 10, 32); err == nil {
			query = query.Where("assigned_user_id = ?", uint(assignedUserID))
		}
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}

	var tasks []models.Task
	if err := query.Order("\"order\" ASC, created_at DESC").Find(&tasks).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve tasks")
		return
	}

	utils.SuccessResponse(c, 200, "Tasks retrieved successfully", tasks)
}

// GetTask godoc
// @Summary Get task by ID
// @Description Get a specific task
// @Tags tasks
// @Produce json
// @Security BearerAuth
// @Param id path int true "Task ID"
// @Success 200 {object} utils.Response{data=models.Task}
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /tasks/{id} [get]
func GetTask(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var task models.Task
	query := config.DB.Preload("Project").Preload("Project.Area").Preload("AssignedUser").Preload("Creator")

	if err := query.First(&task, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Task not found")
		return
	}

	// Check access permissions
	role := userRole.(models.Role)
	if role == models.RoleUser {
		// Users can only see tasks assigned to them
		var assignment models.TaskAssignment
		err := config.DB.Where("task_id = ? AND user_id = ? AND is_active = ?", task.ID, userID.(uint), true).First(&assignment).Error
		if err != nil {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}
	if role == models.RoleAdmin {
		// Load project to check area
		var project models.Project
		if err := config.DB.First(&project, task.ProjectID).Error; err != nil {
			utils.ErrorResponse(c, 500, "Failed to verify permissions")
			return
		}
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if project.AreaID == nil || *project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}

	utils.SuccessResponse(c, 200, "Task retrieved successfully", task)
}

// CreateTask godoc
// @Summary Create new task
// @Description Create a new task within a project. Admins can create tasks for their area's projects, SuperAdmins for any project.
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param task body CreateTaskRequest true "Task data"
// @Success 201 {object} utils.Response{data=models.Task}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /tasks [post]
func CreateTask(c *gin.Context) {
	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	// Verify project exists and user has access
	var project models.Project
	if err := config.DB.First(&project, req.ProjectID).Error; err != nil {
		utils.ErrorResponse(c, 404, "Project not found")
		return
	}

	// Check permissions
	role := userRole.(models.Role)
	if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if project.AreaID == nil || *project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Cannot create task for project outside your area")
			return
		}
	}

	// If assigning to a user, verify the user exists and has access to the project's area
	if req.AssignedUserID != nil {
		var assignedUser models.User
		if err := config.DB.First(&assignedUser, *req.AssignedUserID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Assigned user not found")
			return
		}

		// Verify user belongs to the project's area (if project has an area)
		if project.AreaID != nil {
			if assignedUser.AreaID == nil || *assignedUser.AreaID != *project.AreaID {
				utils.ErrorResponse(c, 400, "Assigned user must belong to the project's area")
				return
			}
		}
	}

	task := models.Task{
		ProjectID:      req.ProjectID,
		Name:           req.Name,
		Description:    req.Description,
		Priority:       req.Priority,
		CreatedBy:      userID.(uint),
		EstimatedHours: req.EstimatedHours,
		Order:          req.Order,
		Status:         models.TaskStatusBacklog,
	}

	// Parse due date if provided
	if req.DueDate != nil && *req.DueDate != "" {
		dueDate, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid due_date format, use YYYY-MM-DD")
			return
		}
		task.DueDate = &dueDate
	}

	// Set status based on assignment
	if req.AssignedUserID != nil {
		task.Status = models.TaskStatusAssigned
	}

	if err := config.DB.Create(&task).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create task")
		return
	}

	// Reload with relations
	config.DB.Preload("Project").Preload("AssignedUser").Preload("Creator").First(&task, task.ID)

	utils.SuccessResponse(c, 201, "Task created successfully", task)
}

// UpdateTask godoc
// @Summary Update task
// @Description Update an existing task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Task ID"
// @Param task body UpdateTaskRequest true "Task data"
// @Success 200 {object} utils.Response{data=models.Task}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /tasks/{id} [put]
func UpdateTask(c *gin.Context) {
	id := c.Param("id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var task models.Task
	if err := config.DB.Preload("Project").First(&task, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Task not found")
		return
	}

	// Check permissions
	role := userRole.(models.Role)
	if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if task.Project.AreaID == nil || *task.Project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	}

	var req models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Update fields
	if req.Name != "" {
		task.Name = req.Name
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Priority != "" {
		task.Priority = req.Priority
	}
	if req.EstimatedHours != nil {
		task.EstimatedHours = *req.EstimatedHours
	}
	if req.Order != nil {
		task.Order = *req.Order
	}
	if req.IsActive != nil {
		task.IsActive = *req.IsActive
	}
	if req.DueDate != nil && *req.DueDate != "" {
		dueDate, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid due_date format, use YYYY-MM-DD")
			return
		}
		task.DueDate = &dueDate
	}

	// Handle assignment changes
	if req.AssignedUserID != nil {
		if *req.AssignedUserID == 0 {
			// Deactivate all task assignments
			config.DB.Model(&models.TaskAssignment{}).Where("task_id = ?", task.ID).Update("is_active", false)
			if task.Status == models.TaskStatusAssigned {
				task.Status = models.TaskStatusBacklog
			}
		} else {
			// Verify new assigned user
			var assignedUser models.User
			if err := config.DB.First(&assignedUser, *req.AssignedUserID).Error; err != nil {
				utils.ErrorResponse(c, 404, "Assigned user not found")
				return
			}

			// Verify user belongs to the project's area
			if task.Project.AreaID != nil {
				if assignedUser.AreaID == nil || *assignedUser.AreaID != *task.Project.AreaID {
					utils.ErrorResponse(c, 400, "Assigned user must belong to the project's area")
					return
				}
			}

			// Deactivate old assignments and create new one
			config.DB.Model(&models.TaskAssignment{}).Where("task_id = ?", task.ID).Update("is_active", false)
			assignment := models.TaskAssignment{
				TaskID:   task.ID,
				UserID:   *req.AssignedUserID,
				IsActive: true,
			}
			config.DB.Create(&assignment)

			if task.Status == models.TaskStatusBacklog {
				task.Status = models.TaskStatusAssigned
			}
		}
	}

	if err := config.DB.Save(&task).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update task")
		return
	}

	// Reload with relations
	config.DB.Preload("Project").Preload("AssignedUser").Preload("Creator").First(&task, task.ID)

	utils.SuccessResponse(c, 200, "Task updated successfully", task)
}

// UpdateTaskStatus godoc
// @Summary Update task status
// @Description Update the status of a task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Task ID"
// @Param status body UpdateTaskStatusRequest true "New status"
// @Success 200 {object} utils.Response{data=models.Task}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /tasks/{id}/status [patch]
func UpdateTaskStatus(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var task models.Task
	if err := config.DB.Preload("Project").First(&task, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Task not found")
		return
	}

	// Check permissions
	role := userRole.(models.Role)
	canUpdate := false

	if role == models.RoleSuperAdmin {
		canUpdate = true
	} else if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if ok && areaID != nil && task.Project.AreaID != nil && *task.Project.AreaID == *areaID {
			canUpdate = true
		}
	} else if role == models.RoleUser {
		// Users can update status of their own tasks
		var assignment models.TaskAssignment
		err := config.DB.Where("task_id = ? AND user_id = ? AND is_active = ?", task.ID, userID.(uint), true).First(&assignment).Error
		if err == nil {
			canUpdate = true
		}
	}

	if !canUpdate {
		utils.ErrorResponse(c, 403, "Access denied")
		return
	}

	var req models.UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	task.Status = req.Status

	if err := config.DB.Save(&task).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update task status")
		return
	}

	// Reload with relations
	config.DB.Preload("Project").Preload("AssignedUser").Preload("Creator").First(&task, task.ID)

	utils.SuccessResponse(c, 200, "Task status updated successfully", task)
}

// BulkUpdateTaskOrder godoc
// @Summary Bulk update task order
// @Description Update the order of multiple tasks at once (for drag-and-drop reordering)
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param tasks body BulkUpdateTaskOrderRequest true "Tasks with new order"
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Router /tasks/bulk-order [patch]
func BulkUpdateTaskOrder(c *gin.Context) {
	var req models.BulkUpdateTaskOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	// Update each task's order
	for _, taskUpdate := range req.Tasks {
		var task models.Task
		if err := config.DB.Preload("Project").First(&task, taskUpdate.ID).Error; err != nil {
			continue // Skip tasks that don't exist
		}

		// Check permissions
		role := userRole.(models.Role)
		if role == models.RoleAdmin {
			areaID, ok := userAreaID.(*uint)
			if !ok || areaID == nil || task.Project.AreaID == nil || *task.Project.AreaID != *areaID {
				continue // Skip tasks user can't access
			}
		}

		task.Order = taskUpdate.Order
		config.DB.Save(&task)
	}

	utils.SuccessResponse(c, 200, "Task order updated successfully", nil)
}

// DeleteTask godoc
// @Summary Delete task
// @Description Soft delete a task (Admin and SuperAdmin only)
// @Tags tasks
// @Security BearerAuth
// @Param id path int true "Task ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /tasks/{id} [delete]
func DeleteTask(c *gin.Context) {
	id := c.Param("id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var task models.Task
	if err := config.DB.Preload("Project").First(&task, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Task not found")
		return
	}

	// Check permissions - only Admins and SuperAdmins can delete tasks
	role := userRole.(models.Role)
	if role == models.RoleAdmin {
		areaID, ok := userAreaID.(*uint)
		if !ok || areaID == nil {
			utils.ErrorResponse(c, 403, "Admin must have an area assigned")
			return
		}
		if task.Project.AreaID == nil || *task.Project.AreaID != *areaID {
			utils.ErrorResponse(c, 403, "Access denied")
			return
		}
	} else if role == models.RoleUser {
		utils.ErrorResponse(c, 403, "Only administrators can delete tasks")
		return
	}

	if err := config.DB.Delete(&task).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete task")
		return
	}

	utils.SuccessResponse(c, 200, "Task deleted successfully", nil)
}
