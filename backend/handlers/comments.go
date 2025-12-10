package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"github.com/jaliko05/time-flow/utils"
)

type CreateCommentRequest struct {
	ProjectID *uint  `json:"project_id"`
	TaskID    *uint  `json:"task_id"`
	Content   string `json:"content" binding:"required"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

// GetComments godoc
// @Summary Get comments
// @Description Get comments for a project or task
// @Tags comments
// @Produce json
// @Security BearerAuth
// @Param project_id query int false "Project ID"
// @Param task_id query int false "Task ID"
// @Success 200 {object} utils.Response{data=[]models.Comment}
// @Failure 401 {object} utils.Response
// @Router /comments [get]
func GetComments(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	query := config.DB.Preload("User")

	// Filter by project_id or task_id
	projectIDStr := c.Query("project_id")
	taskIDStr := c.Query("task_id")

	if projectIDStr == "" && taskIDStr == "" {
		utils.ErrorResponse(c, 400, "Either project_id or task_id is required")
		return
	}

	if projectIDStr != "" {
		projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid project_id")
			return
		}

		// Verify user has access to the project
		var project models.Project
		if err := config.DB.First(&project, projectID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Project not found")
			return
		}

		// Check access permissions
		role := userRole.(models.Role)
		if role == models.RoleUser {
			if project.AssignedUserID == nil || *project.AssignedUserID != userID.(uint) {
				utils.ErrorResponse(c, 403, "Access denied")
				return
			}
		} else if role == models.RoleAdmin {
			if userAreaID == nil || project.AreaID == nil || *project.AreaID != *userAreaID.(*uint) {
				utils.ErrorResponse(c, 403, "Access denied")
				return
			}
		}

		query = query.Where("project_id = ?", projectID)
	}

	if taskIDStr != "" {
		taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
		if err != nil {
			utils.ErrorResponse(c, 400, "Invalid task_id")
			return
		}

		// Verify user has access to the task's project
		var task models.Task
		if err := config.DB.Preload("Project").First(&task, taskID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Task not found")
			return
		}

		// Check access permissions based on project
		role := userRole.(models.Role)
		if role == models.RoleUser {
			if task.Project.AssignedUserID == nil || *task.Project.AssignedUserID != userID.(uint) {
				utils.ErrorResponse(c, 403, "Access denied")
				return
			}
		} else if role == models.RoleAdmin {
			if userAreaID == nil || task.Project.AreaID == nil || *task.Project.AreaID != *userAreaID.(*uint) {
				utils.ErrorResponse(c, 403, "Access denied")
				return
			}
		}

		query = query.Where("task_id = ?", taskID)
	}

	var comments []models.Comment
	if err := query.Order("created_at DESC").Find(&comments).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve comments")
		return
	}

	utils.SuccessResponse(c, 200, "Comments retrieved successfully", comments)
}

// CreateComment godoc
// @Summary Create new comment
// @Description Create a new comment on a project or task
// @Tags comments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param comment body CreateCommentRequest true "Comment data"
// @Success 201 {object} utils.Response{data=models.Comment}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /comments [post]
func CreateComment(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userAreaID, _ := c.Get("user_area_id")

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	// Validate that either project_id or task_id is provided
	if req.ProjectID == nil && req.TaskID == nil {
		utils.ErrorResponse(c, 400, "Either project_id or task_id is required")
		return
	}

	if req.ProjectID != nil && req.TaskID != nil {
		utils.ErrorResponse(c, 400, "Cannot specify both project_id and task_id")
		return
	}

	// Verify access to project or task
	role := userRole.(models.Role)

	if req.ProjectID != nil {
		var project models.Project
		if err := config.DB.First(&project, req.ProjectID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Project not found")
			return
		}

		// Check permissions
		if role == models.RoleUser {
			if project.AssignedUserID == nil || *project.AssignedUserID != userID.(uint) {
				utils.ErrorResponse(c, 403, "You can only comment on projects assigned to you")
				return
			}
		} else if role == models.RoleAdmin {
			if userAreaID == nil || project.AreaID == nil || *project.AreaID != *userAreaID.(*uint) {
				utils.ErrorResponse(c, 403, "You can only comment on projects in your area")
				return
			}
		}
	}

	if req.TaskID != nil {
		var task models.Task
		if err := config.DB.Preload("Project").First(&task, req.TaskID).Error; err != nil {
			utils.ErrorResponse(c, 404, "Task not found")
			return
		}

		// Check permissions based on project
		if role == models.RoleUser {
			if task.Project.AssignedUserID == nil || *task.Project.AssignedUserID != userID.(uint) {
				utils.ErrorResponse(c, 403, "You can only comment on tasks in projects assigned to you")
				return
			}
		} else if role == models.RoleAdmin {
			if userAreaID == nil || task.Project.AreaID == nil || *task.Project.AreaID != *userAreaID.(*uint) {
				utils.ErrorResponse(c, 403, "You can only comment on tasks in projects in your area")
				return
			}
		}
	}

	comment := models.Comment{
		UserID:    userID.(uint),
		ProjectID: req.ProjectID,
		TaskID:    req.TaskID,
		Content:   req.Content,
	}

	if err := config.DB.Create(&comment).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to create comment")
		return
	}

	// Load user relation
	config.DB.Preload("User").First(&comment, comment.ID)

	utils.SuccessResponse(c, 201, "Comment created successfully", comment)
}

// UpdateComment godoc
// @Summary Update comment
// @Description Update an existing comment
// @Tags comments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Comment ID"
// @Param comment body UpdateCommentRequest true "Comment data"
// @Success 200 {object} utils.Response{data=models.Comment}
// @Failure 400 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /comments/{id} [patch]
func UpdateComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	var comment models.Comment
	if err := config.DB.First(&comment, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Comment not found")
		return
	}

	// Only the comment owner can update it
	if comment.UserID != userID.(uint) {
		utils.ErrorResponse(c, 403, "You can only update your own comments")
		return
	}

	comment.Content = req.Content

	if err := config.DB.Save(&comment).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to update comment")
		return
	}

	// Load user relation
	config.DB.Preload("User").First(&comment, comment.ID)

	utils.SuccessResponse(c, 200, "Comment updated successfully", comment)
}

// DeleteComment godoc
// @Summary Delete comment
// @Description Soft delete a comment
// @Tags comments
// @Produce json
// @Security BearerAuth
// @Param id path int true "Comment ID"
// @Success 200 {object} utils.Response
// @Failure 401 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /comments/{id} [delete]
func DeleteComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var comment models.Comment
	if err := config.DB.First(&comment, id).Error; err != nil {
		utils.ErrorResponse(c, 404, "Comment not found")
		return
	}

	// Only the comment owner or admins/superadmins can delete it
	role := userRole.(models.Role)
	if comment.UserID != userID.(uint) && role == models.RoleUser {
		utils.ErrorResponse(c, 403, "You can only delete your own comments")
		return
	}

	if err := config.DB.Delete(&comment).Error; err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete comment")
		return
	}

	utils.SuccessResponse(c, 200, "Comment deleted successfully", nil)
}
