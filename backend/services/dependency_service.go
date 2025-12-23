package services

import (
	"errors"

	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"gorm.io/gorm"
)

// DependencyService maneja la lógica de negocio para dependencias entre actividades
type DependencyService struct {
	DB *gorm.DB
}

// NewDependencyService crea una nueva instancia del servicio
func NewDependencyService() *DependencyService {
	return &DependencyService{
		DB: config.DB,
	}
}

// ValidateActivityDependency verifica si una actividad puede iniciar basándose en sus dependencias
func (s *DependencyService) ValidateActivityDependency(activityID uint) (bool, error) {
	var activity models.ProcessActivity
	if err := s.DB.Preload("DependsOn").First(&activity, activityID).Error; err != nil {
		return false, err
	}

	return activity.CanStart(s.DB), nil
}

// CheckCircularDependency verifica si agregar una dependencia crearía un ciclo
func (s *DependencyService) CheckCircularDependency(activityID uint, dependsOnID uint) bool {
	// No puede depender de sí misma
	if activityID == dependsOnID {
		return true
	}

	// Obtener la actividad de la que se quiere depender
	var dependsOn models.ProcessActivity
	if err := s.DB.First(&dependsOn, dependsOnID).Error; err != nil {
		return false
	}

	// Si la actividad dependiente no tiene más dependencias, no hay ciclo
	if dependsOn.DependsOnID == nil {
		return false
	}

	// Verificar recursivamente
	return s.checkDependencyChain(activityID, *dependsOn.DependsOnID, make(map[uint]bool))
}

// checkDependencyChain verifica recursivamente la cadena de dependencias
func (s *DependencyService) checkDependencyChain(targetID uint, currentID uint, visited map[uint]bool) bool {
	// Si ya visitamos esta actividad, hay un ciclo
	if visited[currentID] {
		return true
	}

	// Si encontramos el ID objetivo, hay un ciclo
	if currentID == targetID {
		return true
	}

	visited[currentID] = true

	// Obtener la siguiente actividad en la cadena
	var activity models.ProcessActivity
	if err := s.DB.First(&activity, currentID).Error; err != nil {
		return false
	}

	// Si no tiene más dependencias, no hay ciclo
	if activity.DependsOnID == nil {
		return false
	}

	// Continuar verificando la cadena
	return s.checkDependencyChain(targetID, *activity.DependsOnID, visited)
}

// GetBlockedActivities obtiene las actividades que están bloqueadas por una actividad específica
func (s *DependencyService) GetBlockedActivities(activityID uint) ([]models.ProcessActivity, error) {
	var blockedActivities []models.ProcessActivity
	if err := s.DB.Where("depends_on_id = ?", activityID).
		Preload("AssignedUser").
		Find(&blockedActivities).Error; err != nil {
		return nil, err
	}

	return blockedActivities, nil
}

// GetDependencyChain obtiene la cadena completa de dependencias para una actividad
func (s *DependencyService) GetDependencyChain(activityID uint) ([]models.ProcessActivity, error) {
	var chain []models.ProcessActivity
	var activity models.ProcessActivity

	if err := s.DB.Preload("DependsOn").First(&activity, activityID).Error; err != nil {
		return nil, err
	}

	chain = append(chain, activity)

	// Seguir la cadena de dependencias hacia atrás
	currentActivity := activity
	for currentActivity.DependsOnID != nil {
		var dependsOn models.ProcessActivity
		if err := s.DB.Preload("DependsOn").First(&dependsOn, *currentActivity.DependsOnID).Error; err != nil {
			break
		}
		chain = append([]models.ProcessActivity{dependsOn}, chain...)
		currentActivity = dependsOn
	}

	return chain, nil
}

// CanStartActivity verifica si una actividad puede comenzar
func (s *DependencyService) CanStartActivity(activityID uint) (bool, string, error) {
	var activity models.ProcessActivity
	if err := s.DB.Preload("DependsOn").First(&activity, activityID).Error; err != nil {
		return false, "Activity not found", err
	}

	// Si no tiene dependencias, puede comenzar
	if activity.DependsOnID == nil {
		return true, "No dependencies", nil
	}

	// Verificar estado de la dependencia
	var dependsOn models.ProcessActivity
	if err := s.DB.First(&dependsOn, *activity.DependsOnID).Error; err != nil {
		return false, "Dependency not found", err
	}

	if dependsOn.Status != models.ActivityStatusCompleted {
		return false, "Dependency not completed: " + dependsOn.Name, nil
	}

	return true, "All dependencies met", nil
}

// UpdateActivityStatus actualiza el estado de una actividad y notifica a las bloqueadas
func (s *DependencyService) UpdateActivityStatus(activityID uint, newStatus models.ActivityStatus) error {
	var activity models.ProcessActivity
	if err := s.DB.First(&activity, activityID).Error; err != nil {
		return err
	}

	// Actualizar estado
	activity.Status = newStatus
	if err := s.DB.Save(&activity).Error; err != nil {
		return err
	}

	// Si se completó, obtener actividades bloqueadas
	if newStatus == models.ActivityStatusCompleted {
		blockedActivities, err := s.GetBlockedActivities(activityID)
		if err != nil {
			return err
		}

		// Las actividades bloqueadas ahora pueden potencialmente comenzar
		// (esta es una oportunidad para enviar notificaciones en el futuro)
		_ = blockedActivities
	}

	return nil
}

// ValidateDependencyBeforeCreate valida que se puede crear una dependencia
func (s *DependencyService) ValidateDependencyBeforeCreate(activityID uint, dependsOnID uint, processID uint) error {
	// Verificar que ambas actividades pertenecen al mismo proceso
	var activity, dependsOn models.ProcessActivity

	if err := s.DB.First(&activity, activityID).Error; err != nil {
		return errors.New("activity not found")
	}

	if err := s.DB.First(&dependsOn, dependsOnID).Error; err != nil {
		return errors.New("dependency activity not found")
	}

	if activity.ProcessID != processID || dependsOn.ProcessID != processID {
		return errors.New("activities must belong to the same process")
	}

	// Verificar ciclos
	if s.CheckCircularDependency(activityID, dependsOnID) {
		return errors.New("circular dependency detected")
	}

	return nil
}
