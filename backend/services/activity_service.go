package services

import (
	"time"

	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/helpers"
	"github.com/jaliko05/time-flow/models"
	"gorm.io/gorm"
)

// ActivityService handles business logic for activities
type ActivityService struct {
	db *gorm.DB
}

// NewActivityService creates a new activity service
func NewActivityService() *ActivityService {
	return &ActivityService{db: config.DB}
}

// GetActivities retrieves activities with filters
func (s *ActivityService) GetActivities(filters map[string]interface{}) ([]models.Activity, error) {
	var activities []models.Activity
	query := s.db.Preload("User").Preload("Area").Preload("Project").Preload("Task")

	// Apply filters
	for key, value := range filters {
		switch key {
		case "user_id", "area_id", "project_id", "task_id":
			query = query.Where(key+" = ?", value)
		case "user_email":
			query = query.Where("user_email = ?", value)
		case "activity_type":
			query = query.Where("activity_type = ?", value)
		case "date":
			query = query.Where("date = ?", value)
		case "month":
			query = query.Where("month = ?", value)
		case "date_from":
			query = query.Where("date >= ?", value)
		case "date_to":
			query = query.Where("date <= ?", value)
		}
	}

	err := query.Order("date DESC, created_at DESC").Find(&activities).Error
	return activities, err
}

// GetActivityByID retrieves a single activity by ID
func (s *ActivityService) GetActivityByID(id uint) (*models.Activity, error) {
	var activity models.Activity
	err := s.db.Preload("User").
		Preload("Area").
		Preload("Project").
		Preload("Task").
		First(&activity, id).Error

	if err != nil {
		return nil, err
	}
	return &activity, nil
}

// CreateActivity creates a new activity
func (s *ActivityService) CreateActivity(activity *models.Activity) error {
	// Set month automatically
	activity.Month = helpers.FormatMonth(activity.Date)
	return s.db.Create(activity).Error
}

// UpdateActivity updates an existing activity
func (s *ActivityService) UpdateActivity(id uint, updates map[string]interface{}) error {
	// If date is being updated, update month too
	if dateVal, ok := updates["date"]; ok {
		if date, ok := dateVal.(time.Time); ok {
			updates["month"] = helpers.FormatMonth(date)
		}
	}

	return s.db.Model(&models.Activity{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteActivity soft deletes an activity
func (s *ActivityService) DeleteActivity(id uint) error {
	return s.db.Delete(&models.Activity{}, id).Error
}

// GetActivityStats calculates statistics for activities
func (s *ActivityService) GetActivityStats(filters map[string]interface{}) (map[string]interface{}, error) {
	query := s.db.Model(&models.Activity{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "area_id", "user_id", "project_id":
			query = query.Where(key+" = ?", value)
		case "date_from":
			query = query.Where("date >= ?", value)
		case "date_to":
			query = query.Where("date <= ?", value)
		case "month":
			query = query.Where("month = ?", value)
		}
	}

	var totalHours float64
	var totalActivities int64

	err := query.Select("COALESCE(SUM(execution_time), 0)").Scan(&totalHours).Error
	if err != nil {
		return nil, err
	}

	err = query.Count(&totalActivities).Error
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_hours":      totalHours,
		"total_activities": totalActivities,
	}

	return stats, nil
}
