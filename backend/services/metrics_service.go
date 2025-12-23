package services

import (
	"time"

	"github.com/jaliko05/time-flow/config"
	"github.com/jaliko05/time-flow/models"
	"gorm.io/gorm"
)

// MetricsService maneja el cálculo de métricas y estadísticas
type MetricsService struct {
	DB *gorm.DB
}

// NewMetricsService crea una nueva instancia del servicio de métricas
func NewMetricsService() *MetricsService {
	return &MetricsService{DB: config.DB}
}

// SuperAdminMetrics contiene las métricas globales para SuperAdmin
type SuperAdminMetrics struct {
	TotalAreas           int64                     `json:"total_areas"`
	TotalUsers           int64                     `json:"total_users"`
	TotalProjects        int64                     `json:"total_projects"`
	ActiveProjects       int64                     `json:"active_projects"`
	CompletedProjects    int64                     `json:"completed_projects"`
	TotalRequirements    int64                     `json:"total_requirements"`
	TotalIncidents       int64                     `json:"total_incidents"`
	TotalProcesses       int64                     `json:"total_processes"`
	ProjectsByArea       []ProjectsByAreaMetric    `json:"projects_by_area"`
	UsersByArea          []UsersByAreaMetric       `json:"users_by_area"`
	ProjectStatusDistrib ProjectStatusDistribution `json:"project_status_distribution"`
	RecentActivity       []RecentActivityMetric    `json:"recent_activity"`
}

// AdminMetrics contiene las métricas para Admin de un área específica
type AdminMetrics struct {
	AreaID               uint                      `json:"area_id"`
	AreaName             string                    `json:"area_name"`
	TotalUsers           int64                     `json:"total_users"`
	AvailableUsers       int64                     `json:"available_users"`
	BusyUsers            int64                     `json:"busy_users"`
	TotalProjects        int64                     `json:"total_projects"`
	ActiveProjects       int64                     `json:"active_projects"`
	CompletedProjects    int64                     `json:"completed_projects"`
	TotalRequirements    int64                     `json:"total_requirements"`
	TotalIncidents       int64                     `json:"total_incidents"`
	TotalProcesses       int64                     `json:"total_processes"`
	ProjectStatusDistrib ProjectStatusDistribution `json:"project_status_distribution"`
	UserWorkloads        []UserWorkloadMetric      `json:"user_workloads"`
	UpcomingDeadlines    []DeadlineMetric          `json:"upcoming_deadlines"`
}

// UserMetrics contiene las métricas para Usuario regular
type UserMetrics struct {
	UserID              uint             `json:"user_id"`
	TotalProjects       int64            `json:"total_projects"`
	ActiveProjects      int64            `json:"active_projects"`
	TotalActivities     int64            `json:"total_activities"`
	PendingActivities   int64            `json:"pending_activities"`
	CompletedActivities int64            `json:"completed_activities"`
	TotalProcesses      int64            `json:"total_processes"`
	ActiveProcesses     int64            `json:"active_processes"`
	HoursThisWeek       float64          `json:"hours_this_week"`
	HoursThisMonth      float64          `json:"hours_this_month"`
	UpcomingDeadlines   []DeadlineMetric `json:"upcoming_deadlines"`
}

// Estructuras auxiliares para métricas
type ProjectsByAreaMetric struct {
	AreaID            uint   `json:"area_id"`
	AreaName          string `json:"area_name"`
	TotalProjects     int64  `json:"total_projects"`
	ActiveProjects    int64  `json:"active_projects"`
	CompletedProjects int64  `json:"completed_projects"`
}

type UsersByAreaMetric struct {
	AreaID     uint   `json:"area_id"`
	AreaName   string `json:"area_name"`
	TotalUsers int64  `json:"total_users"`
}

type ProjectStatusDistribution struct {
	Planning  int64 `json:"planning"`
	Active    int64 `json:"active"`
	OnHold    int64 `json:"on_hold"`
	Completed int64 `json:"completed"`
	Cancelled int64 `json:"cancelled"`
}

type RecentActivityMetric struct {
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	UserName  string    `json:"user_name"`
	ProjectID uint      `json:"project_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type UserWorkloadMetric struct {
	UserID            uint    `json:"user_id"`
	UserName          string  `json:"user_name"`
	ActiveProcesses   int64   `json:"active_processes"`
	PendingActivities int64   `json:"pending_activities"`
	EstimatedHours    float64 `json:"estimated_hours_remaining"`
}

type DeadlineMetric struct {
	ProjectID   uint      `json:"project_id"`
	ProjectName string    `json:"project_name"`
	Deadline    time.Time `json:"deadline"`
	DaysLeft    int       `json:"days_left"`
}

// GetSuperAdminMetrics obtiene todas las métricas globales
func (s *MetricsService) GetSuperAdminMetrics() (*SuperAdminMetrics, error) {
	metrics := &SuperAdminMetrics{}

	// Total de áreas
	if err := s.DB.Model(&models.Area{}).Count(&metrics.TotalAreas).Error; err != nil {
		return nil, err
	}

	// Total de usuarios
	if err := s.DB.Model(&models.User{}).Count(&metrics.TotalUsers).Error; err != nil {
		return nil, err
	}

	// Total de proyectos
	if err := s.DB.Model(&models.Project{}).Count(&metrics.TotalProjects).Error; err != nil {
		return nil, err
	}

	// Proyectos activos
	if err := s.DB.Model(&models.Project{}).Where("status = ?", models.ProjectStatusInProgress).Count(&metrics.ActiveProjects).Error; err != nil {
		return nil, err
	}

	// Proyectos completados
	if err := s.DB.Model(&models.Project{}).Where("status = ?", models.ProjectStatusCompleted).Count(&metrics.CompletedProjects).Error; err != nil {
		return nil, err
	}

	// Total de requerimientos
	if err := s.DB.Model(&models.Requirement{}).Count(&metrics.TotalRequirements).Error; err != nil {
		return nil, err
	}

	// Total de incidentes
	if err := s.DB.Model(&models.Incident{}).Count(&metrics.TotalIncidents).Error; err != nil {
		return nil, err
	}

	// Total de procesos
	if err := s.DB.Model(&models.Process{}).Count(&metrics.TotalProcesses).Error; err != nil {
		return nil, err
	}

	// Proyectos por área
	metrics.ProjectsByArea = s.getProjectsByArea()

	// Usuarios por área
	metrics.UsersByArea = s.getUsersByArea()

	// Distribución de estados de proyectos
	metrics.ProjectStatusDistrib = s.getProjectStatusDistribution(nil)

	// Actividad reciente (últimos 10 registros)
	metrics.RecentActivity = s.getRecentActivity(10)

	return metrics, nil
}

// GetAdminMetrics obtiene las métricas para un admin de un área específica
func (s *MetricsService) GetAdminMetrics(areaID uint) (*AdminMetrics, error) {
	metrics := &AdminMetrics{AreaID: areaID}

	// Obtener información del área
	var area models.Area
	if err := s.DB.First(&area, areaID).Error; err != nil {
		return nil, err
	}
	metrics.AreaName = area.Name

	// Total de usuarios del área
	if err := s.DB.Model(&models.User{}).Where("area_id = ?", areaID).Count(&metrics.TotalUsers).Error; err != nil {
		return nil, err
	}

	// Usuarios disponibles vs ocupados (simplificado: usuarios con 0 procesos activos vs >0)
	var busyUserCount int64
	s.DB.Table("users").
		Joins("JOIN process_assignments ON users.id = process_assignments.user_id").
		Joins("JOIN processes ON process_assignments.process_id = processes.id").
		Where("users.area_id = ? AND processes.status IN (?)", areaID, []string{"pending", "in_progress"}).
		Distinct("users.id").
		Count(&busyUserCount)
	metrics.BusyUsers = busyUserCount
	metrics.AvailableUsers = metrics.TotalUsers - metrics.BusyUsers

	// Proyectos del área (a través de project_areas)
	if err := s.DB.Table("projects").
		Joins("JOIN project_areas ON projects.id = project_areas.project_id").
		Where("project_areas.area_id = ?", areaID).
		Count(&metrics.TotalProjects).Error; err != nil {
		return nil, err
	}

	// Proyectos activos del área
	if err := s.DB.Table("projects").
		Joins("JOIN project_areas ON projects.id = project_areas.project_id").
		Where("project_areas.area_id = ? AND projects.status = ?", areaID, models.ProjectStatusInProgress).
		Count(&metrics.ActiveProjects).Error; err != nil {
		return nil, err
	}

	// Proyectos completados del área
	if err := s.DB.Table("projects").
		Joins("JOIN project_areas ON projects.id = project_areas.project_id").
		Where("project_areas.area_id = ? AND projects.status = ?", areaID, models.ProjectStatusCompleted).
		Count(&metrics.CompletedProjects).Error; err != nil {
		return nil, err
	}

	// Requerimientos de proyectos del área
	if err := s.DB.Table("requirements").
		Joins("JOIN projects ON requirements.project_id = projects.id").
		Joins("JOIN project_areas ON projects.id = project_areas.project_id").
		Where("project_areas.area_id = ?", areaID).
		Count(&metrics.TotalRequirements).Error; err != nil {
		return nil, err
	}

	// Incidentes de proyectos del área
	if err := s.DB.Table("incidents").
		Joins("JOIN projects ON incidents.project_id = projects.id").
		Joins("JOIN project_areas ON projects.id = project_areas.project_id").
		Where("project_areas.area_id = ?", areaID).
		Count(&metrics.TotalIncidents).Error; err != nil {
		return nil, err
	}

	// Procesos del área
	if err := s.DB.Table("processes").
		Joins("LEFT JOIN requirements ON processes.requirement_id = requirements.id").
		Joins("LEFT JOIN incidents ON processes.incident_id = incidents.id").
		Joins("LEFT JOIN activities ON processes.activity_id = activities.id").
		Joins("LEFT JOIN projects p1 ON requirements.project_id = p1.id").
		Joins("LEFT JOIN projects p2 ON incidents.project_id = p2.id").
		Joins("LEFT JOIN projects p3 ON activities.project_id = p3.id").
		Joins("LEFT JOIN project_areas pa1 ON p1.id = pa1.project_id").
		Joins("LEFT JOIN project_areas pa2 ON p2.id = pa2.project_id").
		Joins("LEFT JOIN project_areas pa3 ON p3.id = pa3.project_id").
		Where("pa1.area_id = ? OR pa2.area_id = ? OR pa3.area_id = ?", areaID, areaID, areaID).
		Count(&metrics.TotalProcesses).Error; err != nil {
		return nil, err
	}

	// Distribución de estados de proyectos del área
	metrics.ProjectStatusDistrib = s.getProjectStatusDistribution(&areaID)

	// Carga de trabajo de usuarios del área
	metrics.UserWorkloads = s.getUserWorkloads(areaID)

	// Deadlines próximos (proyectos del área)
	metrics.UpcomingDeadlines = s.getUpcomingDeadlines(&areaID, 5)

	return metrics, nil
}

// GetUserMetrics obtiene las métricas para un usuario específico
func (s *MetricsService) GetUserMetrics(userID uint) (*UserMetrics, error) {
	metrics := &UserMetrics{UserID: userID}

	// Proyectos asignados directamente
	var directProjectCount int64
	if err := s.DB.Table("project_assignments").Where("user_id = ?", userID).Count(&directProjectCount).Error; err != nil {
		return nil, err
	}

	// Proyectos a través de procesos (usando AssignmentService logic)
	assignmentService := NewAssignmentService()
	projects, err := assignmentService.GetProjectsVisibleToUser(userID)
	if err != nil {
		return nil, err
	}
	metrics.TotalProjects = int64(len(projects))

	// Proyectos activos
	var activeProjectCount int64
	for _, project := range projects {
		if project.Status == models.ProjectStatusInProgress {
			activeProjectCount++
		}
	}
	metrics.ActiveProjects = activeProjectCount

	// Total de actividades del usuario (actividades en sus proyectos asignados)
	if err := s.DB.Table("activities").
		Joins("JOIN project_assignments ON activities.project_id = project_assignments.project_id").
		Where("project_assignments.user_id = ?", userID).
		Count(&metrics.TotalActivities).Error; err != nil {
		return nil, err
	}

	// Actividades pendientes (status pending)
	if err := s.DB.Table("activities").
		Joins("JOIN project_assignments ON activities.project_id = project_assignments.project_id").
		Where("project_assignments.user_id = ? AND activities.status = ?", userID, models.ActivityStatusPending).
		Count(&metrics.PendingActivities).Error; err != nil {
		return nil, err
	}

	// Actividades completadas
	if err := s.DB.Table("activities").
		Joins("JOIN project_assignments ON activities.project_id = project_assignments.project_id").
		Where("project_assignments.user_id = ? AND activities.status = ?", userID, models.ActivityStatusCompleted).
		Count(&metrics.CompletedActivities).Error; err != nil {
		return nil, err
	}

	// Procesos asignados
	if err := s.DB.Table("process_assignments").Where("user_id = ?", userID).Count(&metrics.TotalProcesses).Error; err != nil {
		return nil, err
	}

	// Procesos activos
	if err := s.DB.Table("process_assignments").
		Joins("JOIN processes ON process_assignments.process_id = processes.id").
		Where("process_assignments.user_id = ? AND processes.status IN (?)", userID, []string{"pending", "in_progress"}).
		Count(&metrics.ActiveProcesses).Error; err != nil {
		return nil, err
	}

	// Horas trabajadas (temporalmente en 0, ActivityLog no está implementado)
	metrics.HoursThisWeek = 0.0
	metrics.HoursThisMonth = 0.0

	// TODO: Implementar cuando ActivityLog exista
	// startOfWeek := time.Now().AddDate(0, 0, -int(time.Now().Weekday()))
	// startOfWeek = time.Date(startOfWeek.Year(), startOfWeek.Month(), startOfWeek.Day(), 0, 0, 0, 0, startOfWeek.Location())
	// var weekHours float64
	// s.DB.Model(&models.ActivityLog{}).
	//     Where("user_id = ? AND date >= ?", userID, startOfWeek).
	//     Select("COALESCE(SUM(hours), 0)").
	//     Scan(&weekHours)
	// metrics.HoursThisWeek = weekHours

	// Deadlines próximos de proyectos del usuario
	metrics.UpcomingDeadlines = s.getUpcomingDeadlinesForUser(userID, 5)

	return metrics, nil
}

// Funciones auxiliares

func (s *MetricsService) getProjectsByArea() []ProjectsByAreaMetric {
	var results []ProjectsByAreaMetric

	s.DB.Table("areas").
		Select("areas.id as area_id, areas.name as area_name, "+
			"COUNT(DISTINCT project_areas.project_id) as total_projects, "+
			"SUM(CASE WHEN projects.status = ? THEN 1 ELSE 0 END) as active_projects, "+
			"SUM(CASE WHEN projects.status = ? THEN 1 ELSE 0 END) as completed_projects",
			models.ProjectStatusInProgress, models.ProjectStatusCompleted).
		Joins("LEFT JOIN project_areas ON areas.id = project_areas.area_id").
		Joins("LEFT JOIN projects ON project_areas.project_id = projects.id").
		Group("areas.id, areas.name").
		Scan(&results)

	return results
}

func (s *MetricsService) getUsersByArea() []UsersByAreaMetric {
	var results []UsersByAreaMetric

	s.DB.Table("areas").
		Select("areas.id as area_id, areas.name as area_name, COUNT(users.id) as total_users").
		Joins("LEFT JOIN users ON areas.id = users.area_id").
		Group("areas.id, areas.name").
		Scan(&results)

	return results
}

func (s *MetricsService) getProjectStatusDistribution(areaID *uint) ProjectStatusDistribution {
	var distrib ProjectStatusDistribution

	query := s.DB.Model(&models.Project{})

	if areaID != nil {
		query = query.Joins("JOIN project_areas ON projects.id = project_areas.project_id").
			Where("project_areas.area_id = ?", *areaID)
	}

	query.Where("status = ?", models.ProjectStatusUnassigned).Count(&distrib.Planning)
	query.Where("status = ?", models.ProjectStatusInProgress).Count(&distrib.Active)
	query.Where("status = ?", models.ProjectStatusPaused).Count(&distrib.OnHold)
	query.Where("status = ?", models.ProjectStatusCompleted).Count(&distrib.Completed)
	distrib.Cancelled = 0 // No hay estado cancelled en el modelo

	return distrib
}

func (s *MetricsService) getRecentActivity(limit int) []RecentActivityMetric {
	var results []RecentActivityMetric

	// Simplificado: últimos activity logs
	// TODO: Implementar cuando ActivityLog exista
	// Temporalmente retornamos actividades recientes
	s.DB.Table("activities").
		Select("'activity' as type, " +
			"CONCAT('Actividad: ', activities.name) as message, " +
			"'' as user_name, " +
			"activities.project_id, " +
			"activities.created_at").
		Order("activities.created_at DESC").
		Limit(limit).
		Scan(&results)

	return results
}

func (s *MetricsService) getUserWorkloads(areaID uint) []UserWorkloadMetric {
	var results []UserWorkloadMetric

	s.DB.Table("users").
		Select("users.id as user_id, "+
			"users.name as user_name, "+
			"COUNT(DISTINCT process_assignments.process_id) as active_processes, "+
			"COUNT(DISTINCT CASE WHEN process_activities.status = 'pending' THEN process_activities.id END) as pending_activities, "+
			"COALESCE(SUM(CASE WHEN process_activities.status = 'pending' THEN process_activities.estimated_hours ELSE 0 END), 0) as estimated_hours").
		Joins("LEFT JOIN process_assignments ON users.id = process_assignments.user_id").
		Joins("LEFT JOIN processes ON process_assignments.process_id = processes.id AND processes.status IN ('pending', 'in_progress')").
		Joins("LEFT JOIN process_activities ON processes.id = process_activities.process_id").
		Where("users.area_id = ?", areaID).
		Group("users.id, users.name").
		Scan(&results)

	return results
}

func (s *MetricsService) getUpcomingDeadlines(areaID *uint, limit int) []DeadlineMetric {
	var results []DeadlineMetric

	query := s.DB.Table("projects").
		Select("projects.id as project_id, "+
			"projects.name as project_name, "+
			"projects.end_date as deadline, "+
			"CAST(JULIANDAY(projects.end_date) - JULIANDAY('now') AS INTEGER) as days_left").
		Where("projects.end_date IS NOT NULL AND projects.end_date >= date('now') AND projects.status IN (?)",
			[]string{string(models.ProjectStatusUnassigned), string(models.ProjectStatusInProgress)})

	if areaID != nil {
		query = query.Joins("JOIN project_areas ON projects.id = project_areas.project_id").
			Where("project_areas.area_id = ?", *areaID)
	}

	query.Order("projects.end_date ASC").Limit(limit).Scan(&results)

	return results
}

func (s *MetricsService) getUpcomingDeadlinesForUser(userID uint, limit int) []DeadlineMetric {
	var results []DeadlineMetric

	s.DB.Table("projects").
		Select("DISTINCT projects.id as project_id, "+
			"projects.name as project_name, "+
			"projects.end_date as deadline, "+
			"CAST(JULIANDAY(projects.end_date) - JULIANDAY('now') AS INTEGER) as days_left").
		Joins("LEFT JOIN project_assignments ON projects.id = project_assignments.project_id").
		Joins("LEFT JOIN requirements ON projects.id = requirements.project_id").
		Joins("LEFT JOIN incidents ON projects.id = incidents.project_id").
		Joins("LEFT JOIN activities ON projects.id = activities.project_id").
		Joins("LEFT JOIN processes p1 ON requirements.id = p1.requirement_id").
		Joins("LEFT JOIN processes p2 ON incidents.id = p2.incident_id").
		Joins("LEFT JOIN processes p3 ON activities.id = p3.activity_id").
		Joins("LEFT JOIN process_assignments pa1 ON p1.id = pa1.process_id").
		Joins("LEFT JOIN process_assignments pa2 ON p2.id = pa2.process_id").
		Joins("LEFT JOIN process_assignments pa3 ON p3.id = pa3.process_id").
		Where("(project_assignments.user_id = ? OR pa1.user_id = ? OR pa2.user_id = ? OR pa3.user_id = ?) "+
			"AND projects.end_date IS NOT NULL AND projects.end_date >= date('now') "+
			"AND projects.status IN (?)",
			userID, userID, userID, userID,
			[]string{string(models.ProjectStatusUnassigned), string(models.ProjectStatusAssigned), string(models.ProjectStatusInProgress)}).
		Order("projects.end_date ASC").
		Limit(limit).
		Scan(&results)

	return results
}
