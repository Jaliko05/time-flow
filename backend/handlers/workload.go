package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jaliko05/time-flow/services"
	"github.com/jaliko05/time-flow/utils"
)

// GetUserWorkload godoc
// @Summary Get user workload
// @Description Get current workload information for a user
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} utils.Response{data=map[string]interface{}}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /users/{id}/workload [get]
func GetUserWorkload(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid user ID")
		return
	}

	assignmentService := services.NewAssignmentService()
	workload, err := assignmentService.GetUserWorkload(uint(id))
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve workload: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 200, "Workload retrieved successfully", workload)
}

// GetUserProcesses godoc
// @Summary Get user assigned processes
// @Description Get all processes assigned to a specific user
// @Tags users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} utils.Response{data=[]models.Process}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /users/{id}/processes [get]
func GetUserProcesses(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid user ID")
		return
	}

	assignmentService := services.NewAssignmentService()
	processes, err := assignmentService.GetUserAssignedProcesses(uint(id))
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve processes: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 200, "Processes retrieved successfully", processes)
}

// GetActivityDependencyChain godoc
// @Summary Get activity dependency chain
// @Description Get the complete dependency chain for a process activity
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Success 200 {object} utils.Response{data=[]models.ProcessActivity}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /process-activities/{id}/dependency-chain [get]
func GetActivityDependencyChain(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid activity ID")
		return
	}

	dependencyService := services.NewDependencyService()
	chain, err := dependencyService.GetDependencyChain(uint(id))
	if err != nil {
		utils.ErrorResponse(c, 404, "Activity not found")
		return
	}

	utils.SuccessResponse(c, 200, "Dependency chain retrieved successfully", chain)
}

// GetBlockedActivities godoc
// @Summary Get blocked activities
// @Description Get all activities that are blocked by a specific activity
// @Tags processes
// @Produce json
// @Security BearerAuth
// @Param id path int true "Activity ID"
// @Success 200 {object} utils.Response{data=[]models.ProcessActivity}
// @Failure 400 {object} utils.Response
// @Failure 404 {object} utils.Response
// @Router /process-activities/{id}/blocked [get]
func GetBlockedActivities(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid activity ID")
		return
	}

	dependencyService := services.NewDependencyService()
	blocked, err := dependencyService.GetBlockedActivities(uint(id))
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to retrieve blocked activities")
		return
	}

	utils.SuccessResponse(c, 200, "Blocked activities retrieved successfully", blocked)
}

// RemoveUserFromProcess godoc
// @Summary Remove user from process
// @Description Remove a user assignment from a process
// @Tags processes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param process_id path int true "Process ID"
// @Param user_id path int true "User ID"
// @Success 200 {object} utils.Response
// @Failure 400 {object} utils.Response
// @Failure 403 {object} utils.Response
// @Router /processes/{process_id}/unassign/{user_id} [delete]
func RemoveUserFromProcess(c *gin.Context) {
	processIDStr := c.Param("process_id")
	processID, err := strconv.ParseUint(processIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid process ID")
		return
	}

	userIDStr := c.Param("user_id")
	userIDToRemove, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, 400, "Invalid user ID")
		return
	}

	assignmentService := services.NewAssignmentService()
	if err := assignmentService.RemoveUserFromProcess(uint(processID), uint(userIDToRemove)); err != nil {
		utils.ErrorResponse(c, 400, err.Error())
		return
	}

	utils.SuccessResponse(c, 200, "User removed from process successfully", gin.H{"removed": true})
}
