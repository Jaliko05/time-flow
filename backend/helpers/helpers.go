package helpers

import (
	"strconv"
	"time"

	"github.com/jaliko05/time-flow/models"
)

// ParseUintParam converts a string parameter to uint
func ParseUintParam(param string) (uint, error) {
	if param == "" {
		return 0, nil
	}
	val, err := strconv.ParseUint(param, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(val), nil
}

// ParseBoolParam converts a string parameter to bool
func ParseBoolParam(param string) bool {
	return param == "true"
}

// ParseDateParam converts a string to time.Time (YYYY-MM-DD format)
func ParseDateParam(param string) (*time.Time, error) {
	if param == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", param)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// CalculateProjectMetrics calculates remaining hours and completion percent
func CalculateProjectMetrics(estimatedHours, usedHours float64) (float64, float64) {
	remainingHours := estimatedHours - usedHours
	if remainingHours < 0 {
		remainingHours = 0
	}

	completionPercent := float64(0)
	if estimatedHours > 0 {
		completionPercent = (usedHours / estimatedHours) * 100
		if completionPercent > 100 {
			completionPercent = 100
		}
	}

	return remainingHours, completionPercent
}

// IsAuthorizedForProject checks if user can access/modify project
// NOTE: This function is deprecated. For user assignment checks, query the project_assignments table directly.
func IsAuthorizedForProject(userID uint, userRole models.Role, userAreaID *uint, project *models.Project) bool {
	// SuperAdmin can access everything
	if userRole == models.RoleSuperAdmin {
		return true
	}

	// Admin can access projects from their area
	if userRole == models.RoleAdmin && userAreaID != nil && project.AreaID != nil {
		return *userAreaID == *project.AreaID
	}

	// User can access their own projects (basic check - does not include assignments)
	// For full authorization including assignments, query project_assignments table
	if userRole == models.RoleUser {
		return project.CreatedBy == userID
	}

	return false
}

// IsAuthorizedForActivity checks if user can access/modify activity
func IsAuthorizedForActivity(userID uint, userRole models.Role, userAreaID *uint, activity *models.Activity) bool {
	// SuperAdmin can access everything
	if userRole == models.RoleSuperAdmin {
		return true
	}

	// Admin can access activities from their area
	if userRole == models.RoleAdmin && userAreaID != nil && activity.AreaID != nil {
		return *userAreaID == *activity.AreaID
	}

	// User can only access their own activities
	if userRole == models.RoleUser {
		return activity.UserID == userID
	}

	return false
}

// FormatMonth returns the month in YYYY-MM format
func FormatMonth(date time.Time) string {
	return date.Format("2006-01")
}

// PointerToUint returns a pointer to uint
func PointerToUint(val uint) *uint {
	return &val
}

// PointerToFloat returns a pointer to float64
func PointerToFloat(val float64) *float64 {
	return &val
}

// PointerToBool returns a pointer to bool
func PointerToBool(val bool) *bool {
	return &val
}

// PointerToString returns a pointer to string
func PointerToString(val string) *string {
	return &val
}

// DerefUint safely dereferences a uint pointer
func DerefUint(ptr *uint, defaultVal uint) uint {
	if ptr == nil {
		return defaultVal
	}
	return *ptr
}

// DerefFloat safely dereferences a float64 pointer
func DerefFloat(ptr *float64, defaultVal float64) float64 {
	if ptr == nil {
		return defaultVal
	}
	return *ptr
}

// DerefBool safely dereferences a bool pointer
func DerefBool(ptr *bool, defaultVal bool) bool {
	if ptr == nil {
		return defaultVal
	}
	return *ptr
}

// DerefString safely dereferences a string pointer
func DerefString(ptr *string, defaultVal string) string {
	if ptr == nil {
		return defaultVal
	}
	return *ptr
}
