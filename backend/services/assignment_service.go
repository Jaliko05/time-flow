package services

import (
	"errors"
	"time"

	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"gorm.io/gorm"
)

// AssignmentService maneja la lógica de negocio para asignaciones de usuarios a procesos
type AssignmentService struct {
	DB *gorm.DB
}

// NewAssignmentService crea una nueva instancia del servicio
func NewAssignmentService() *AssignmentService {
	return &AssignmentService{
		DB: config.DB,
	}
}

// AssignUserToProcess asigna un usuario a un proceso
func (s *AssignmentService) AssignUserToProcess(processID uint, userID uint) error {
	var process models.Process
	if err := s.DB.Preload("AssignedUsers").First(&process, processID).Error; err != nil {
		return errors.New("process not found")
	}

	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	// Verificar si ya está asignado
	for _, assignedUser := range process.AssignedUsers {
		if assignedUser.ID == userID {
			return errors.New("user already assigned to this process")
		}
	}

	// Asignar usando GORM association
	if err := s.DB.Model(&process).Association("AssignedUsers").Append(&user); err != nil {
		return err
	}

	return nil
}

// RemoveUserFromProcess elimina un usuario de un proceso
func (s *AssignmentService) RemoveUserFromProcess(processID uint, userID uint) error {
	var process models.Process
	if err := s.DB.Preload("AssignedUsers").First(&process, processID).Error; err != nil {
		return errors.New("process not found")
	}

	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	// Remover usando GORM association
	if err := s.DB.Model(&process).Association("AssignedUsers").Delete(&user); err != nil {
		return err
	}

	return nil
}

// GetUserAssignedProcesses obtiene todos los procesos asignados a un usuario
func (s *AssignmentService) GetUserAssignedProcesses(userID uint) ([]models.Process, error) {
	var processes []models.Process

	// Query con join a process_assignments
	if err := s.DB.
		Joins("INNER JOIN process_assignments ON process_assignments.process_id = processes.id").
		Where("process_assignments.user_id = ?", userID).
		Preload("Requirement").
		Preload("Requirement.Project").
		Preload("Incident").
		Preload("Incident.Project").
		Preload("Activity").
		Preload("Activity.Project").
		Preload("AssignedUsers").
		Find(&processes).Error; err != nil {
		return nil, err
	}

	return processes, nil
}

// GetProjectsVisibleToUser obtiene proyectos visibles para un usuario basado en:
// 1. Proyectos asignados directamente (project_assignments)
// 2. Proyectos con procesos asignados al usuario
func (s *AssignmentService) GetProjectsVisibleToUser(userID uint) ([]models.Project, error) {
	var projects []models.Project

	// Subquery para proyectos de procesos asignados al usuario
	subquery := s.DB.Table("processes").
		Select("DISTINCT COALESCE(requirements.project_id, incidents.project_id, activities.project_id)").
		Joins("INNER JOIN process_assignments ON process_assignments.process_id = processes.id").
		Joins("LEFT JOIN requirements ON processes.requirement_id = requirements.id").
		Joins("LEFT JOIN incidents ON processes.incident_id = incidents.id").
		Joins("LEFT JOIN activities ON processes.activity_id = activities.id").
		Where("process_assignments.user_id = ? AND (requirements.project_id IS NOT NULL OR incidents.project_id IS NOT NULL OR activities.project_id IS NOT NULL)", userID)

	// Query principal con UNION de ambas fuentes
	if err := s.DB.
		Distinct().
		Preload("Creator").
		Preload("AssignedUsers").
		Preload("Area").
		Preload("Areas").
		Where("projects.id IN (SELECT project_id FROM project_assignments WHERE user_id = ? AND is_active = true) OR projects.id IN (?)", userID, subquery).
		Find(&projects).Error; err != nil {
		return nil, err
	}

	return projects, nil
}

// IsUserAssignedToProcess verifica si un usuario está asignado a un proceso
func (s *AssignmentService) IsUserAssignedToProcess(processID uint, userID uint) (bool, error) {
	var count int64
	if err := s.DB.Table("process_assignments").
		Where("process_id = ? AND user_id = ?", processID, userID).
		Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetProcessAssignments obtiene todas las asignaciones de un proceso con detalles de usuarios
func (s *AssignmentService) GetProcessAssignments(processID uint) ([]models.User, error) {
	var process models.Process
	if err := s.DB.Preload("AssignedUsers").First(&process, processID).Error; err != nil {
		return nil, errors.New("process not found")
	}

	return process.AssignedUsers, nil
}

// AssignMultipleUsersToProcess asigna múltiples usuarios a un proceso de una vez
func (s *AssignmentService) AssignMultipleUsersToProcess(processID uint, userIDs []uint) error {
	var process models.Process
	if err := s.DB.Preload("AssignedUsers").First(&process, processID).Error; err != nil {
		return errors.New("process not found")
	}

	// Obtener usuarios existentes asignados
	existingUserIDs := make(map[uint]bool)
	for _, user := range process.AssignedUsers {
		existingUserIDs[user.ID] = true
	}

	// Filtrar usuarios que no están asignados
	var usersToAssign []models.User
	for _, userID := range userIDs {
		if !existingUserIDs[userID] {
			var user models.User
			if err := s.DB.First(&user, userID).Error; err != nil {
				continue // Skip invalid users
			}
			usersToAssign = append(usersToAssign, user)
		}
	}

	// Asignar todos los usuarios
	if len(usersToAssign) > 0 {
		if err := s.DB.Model(&process).Association("AssignedUsers").Append(&usersToAssign); err != nil {
			return err
		}
	}

	return nil
}

// GetUserWorkload obtiene la carga de trabajo actual de un usuario
func (s *AssignmentService) GetUserWorkload(userID uint) (map[string]interface{}, error) {
	// Procesos activos asignados
	var activeProcessesCount int64
	s.DB.Table("processes").
		Joins("INNER JOIN process_assignments ON process_assignments.process_id = processes.id").
		Where("process_assignments.user_id = ? AND processes.status IN (?)", userID, []string{"pending", "in_progress"}).
		Count(&activeProcessesCount)

	// Actividades pendientes
	var pendingActivitiesCount int64
	s.DB.Model(&models.ProcessActivity{}).
		Where("assigned_user_id = ? AND status IN (?)", userID, []string{"pending", "in_progress"}).
		Count(&pendingActivitiesCount)

	// Horas estimadas restantes
	var totalEstimatedHours float64
	s.DB.Model(&models.ProcessActivity{}).
		Where("assigned_user_id = ? AND status IN (?)", userID, []string{"pending", "in_progress"}).
		Select("COALESCE(SUM(estimated_hours - used_hours), 0)").
		Scan(&totalEstimatedHours)

	// Proyectos activos
	projects, _ := s.GetProjectsVisibleToUser(userID)
	activeProjects := 0
	for _, project := range projects {
		if project.IsActive {
			activeProjects++
		}
	}

	workload := map[string]interface{}{
		"user_id":                   userID,
		"active_processes":          activeProcessesCount,
		"pending_activities":        pendingActivitiesCount,
		"estimated_hours_remaining": totalEstimatedHours,
		"active_projects":           activeProjects,
		"timestamp":                 time.Now(),
	}

	return workload, nil
}

// CanUserAccessProcess verifica si un usuario tiene acceso a un proceso
func (s *AssignmentService) CanUserAccessProcess(processID uint, userID uint, role models.Role) (bool, error) {
	var process models.Process
	if err := s.DB.Preload("AssignedUsers").
		Preload("Requirement.Project").
		Preload("Incident.Project").
		Preload("Activity.Project").
		First(&process, processID).Error; err != nil {
		return false, err
	}

	// SuperAdmin puede acceder a todo
	if role == models.RoleSuperAdmin {
		return true, nil
	}

	// Verificar si el usuario está asignado al proceso
	for _, user := range process.AssignedUsers {
		if user.ID == userID {
			return true, nil
		}
	}

	// Verificar si el usuario está asignado al proyecto del proceso
	var projectID uint
	if process.RequirementID != nil && process.Requirement != nil {
		projectID = process.Requirement.ProjectID
	} else if process.IncidentID != nil && process.Incident != nil {
		projectID = process.Incident.ProjectID
	} else if process.ActivityID != nil && process.Activity != nil && process.Activity.ProjectID != nil {
		projectID = *process.Activity.ProjectID
	}

	if projectID > 0 {
		var count int64
		s.DB.Model(&models.ProjectAssignment{}).
			Where("project_id = ? AND user_id = ? AND is_active = ?", projectID, userID, true).
			Count(&count)
		if count > 0 {
			return true, nil
		}
	}

	return false, nil
}
