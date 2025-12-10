package services

import (
	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"gorm.io/gorm"
)

// ProjectService handles business logic for projects
type ProjectService struct {
	db *gorm.DB
}

// NewProjectService creates a new project service
func NewProjectService() *ProjectService {
	return &ProjectService{db: config.DB}
}

// GetProjects retrieves projects with filters
func (s *ProjectService) GetProjects(filters map[string]interface{}) ([]models.Project, error) {
	var projects []models.Project
	query := s.db.Preload("Creator").Preload("AssignedUser").Preload("Area")

	// Apply filters
	for key, value := range filters {
		query = query.Where(key, value)
	}

	err := query.Order("created_at DESC").Find(&projects).Error
	return projects, err
}

// GetProjectByID retrieves a single project by ID
func (s *ProjectService) GetProjectByID(id uint) (*models.Project, error) {
	var project models.Project
	err := s.db.Preload("Creator").
		Preload("AssignedUser").
		Preload("Area").
		Preload("Tasks").
		Preload("Activities").
		First(&project, id).Error

	if err != nil {
		return nil, err
	}
	return &project, nil
}

// CreateProject creates a new project
func (s *ProjectService) CreateProject(project *models.Project) error {
	return s.db.Create(project).Error
}

// UpdateProject updates an existing project
func (s *ProjectService) UpdateProject(id uint, updates map[string]interface{}) error {
	return s.db.Model(&models.Project{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteProject soft deletes a project
func (s *ProjectService) DeleteProject(id uint) error {
	return s.db.Delete(&models.Project{}, id).Error
}

// UpdateProjectUsedHours updates the used hours of a project
func (s *ProjectService) UpdateProjectUsedHours(projectID uint) error {
	var totalHours float64
	err := s.db.Model(&models.Activity{}).
		Where("project_id = ?", projectID).
		Select("COALESCE(SUM(execution_time), 0)").
		Scan(&totalHours).Error

	if err != nil {
		return err
	}

	return s.db.Model(&models.Project{}).
		Where("id = ?", projectID).
		Update("used_hours", totalHours).Error
}
