// Configuraciones centralizadas para la aplicación

export const STATUS_CONFIG = {
  unassigned: {
    label: "Sin asignar",
    color: "bg-gray-100 text-gray-800 border-gray-300",
  },
  assigned: {
    label: "Asignado",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  in_progress: {
    label: "En progreso",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  paused: {
    label: "Pausado",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  completed: {
    label: "Completado",
    color: "bg-green-100 text-green-800 border-green-300",
  },
};

export const PRIORITY_CONFIG = {
  low: { 
    label: "Baja", 
    color: "bg-gray-200 text-gray-700", 
    icon: "🔵" 
  },
  medium: { 
    label: "Media", 
    color: "bg-blue-200 text-blue-700", 
    icon: "🟡" 
  },
  high: { 
    label: "Alta", 
    color: "bg-orange-200 text-orange-700", 
    icon: "🟠" 
  },
  critical: { 
    label: "Crítica", 
    color: "bg-red-200 text-red-700", 
    icon: "🔴" 
  },
};

export const TASK_COLUMNS = [
  {
    id: "backlog",
    label: "Backlog",
    color: "bg-gray-100 border-gray-300",
    description: "Tareas pendientes por iniciar",
  },
  {
    id: "assigned",
    label: "Asignada",
    color: "bg-blue-100 border-blue-300",
    description: "Tareas asignadas a usuarios",
  },
  {
    id: "in_progress",
    label: "En Progreso",
    color: "bg-yellow-100 border-yellow-300",
    description: "Tareas en desarrollo",
  },
  {
    id: "paused",
    label: "Pausada",
    color: "bg-orange-100 border-orange-300",
    description: "Tareas temporalmente detenidas",
  },
  {
    id: "completed",
    label: "Completada",
    color: "bg-green-100 border-green-300",
    description: "Tareas finalizadas",
  },
];

export const ROLE_CONFIG = {
  user: {
    label: "Usuario",
    description: "Usuario estándar del sistema",
  },
  admin: {
    label: "Administrador",
    description: "Administrador de área",
  },
  superadmin: {
    label: "Super Administrador",
    description: "Administrador del sistema",
  },
};

// Estados de proyecto que permiten registro de actividades
export const ACTIVE_PROJECT_STATUSES = ["in_progress", "completed"];

// Opciones de tipo de proyecto
export const PROJECT_TYPES = {
  personal: "Personal",
  area: "De Área",
  organizational: "Organizacional",
};
