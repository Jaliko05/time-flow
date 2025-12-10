import { ACTIVE_PROJECT_STATUSES } from "@/constants";

/**
 * Filtra proyectos activos (en progreso o completados)
 * @param {Array} projects - Lista de proyectos
 * @returns {Array} - Proyectos activos
 */
export function filterActiveProjects(projects = []) {
  return projects.filter((project) =>
    ACTIVE_PROJECT_STATUSES.includes(project.status)
  );
}

/**
 * Calcula el porcentaje de progreso de un proyecto
 * @param {Object} project - Proyecto
 * @returns {number} - Porcentaje de progreso (0-100)
 */
export function calculateProjectProgress(project) {
  if (!project) return 0;
  
  // Si tiene completion_percent, usarlo
  if (project.completion_percent !== undefined) {
    return Math.min(100, Math.max(0, project.completion_percent));
  }
  
  // Calcular basado en horas si está disponible
  if (project.estimated_hours && project.used_hours) {
    return Math.min(
      100,
      Math.round((project.used_hours / project.estimated_hours) * 100)
    );
  }
  
  return 0;
}

/**
 * Verifica si una fecha está vencida
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} - true si está vencida
 */
export function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Obtiene el conteo de tareas por estado
 * @param {Array} tasks - Lista de tareas
 * @returns {Object} - Conteo de tareas por estado
 */
export function getTaskCountByStatus(tasks = []) {
  return tasks.reduce((acc, task) => {
    const status = task.status || "backlog";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Calcula estadísticas de usuario
 * @param {Array} users - Lista de usuarios con actividades
 * @returns {Object} - Estadísticas agregadas
 */
export function calculateUserStats(users = []) {
  return {
    totalUsers: users.length,
    totalHours: users.reduce((sum, user) => sum + (user.total_hours || 0), 0),
    totalActivities: users.reduce(
      (sum, user) => sum + (user.total_activities || 0),
      0
    ),
    averageHoursPerUser:
      users.length > 0
        ? users.reduce((sum, user) => sum + (user.total_hours || 0), 0) /
          users.length
        : 0,
  };
}

/**
 * Calcula estadísticas de proyectos
 * @param {Array} projects - Lista de proyectos
 * @returns {Object} - Estadísticas agregadas
 */
export function calculateProjectStats(projects = []) {
  const activeProjects = projects.filter((p) => p.is_active);
  
  return {
    total: projects.length,
    active: activeProjects.length,
    inProgress: activeProjects.filter((p) => p.status === "in_progress").length,
    completed: activeProjects.filter((p) => p.status === "completed").length,
    paused: activeProjects.filter((p) => p.status === "paused").length,
  };
}
