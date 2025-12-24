import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para manejar permisos de usuario basados en roles
 * @returns {Object} Objeto con permisos del usuario
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || "";

  return {
    // Permisos de proyectos
    canCreateProject: role === "superadmin" || role === "admin",
    canEditProject: role === "superadmin" || role === "admin",
    canDeleteProject: role === "superadmin",
    canViewAllProjects: role === "superadmin",
    canViewAreaProjects: role === "admin" || role === "superadmin",
    
    // Permisos de usuarios
    canCreateUser: role === "superadmin" || role === "admin",
    canEditUser: role === "superadmin" || role === "admin",
    canDeleteUser: role === "superadmin",
    canViewAllUsers: role === "superadmin",
    canViewAreaUsers: role === "admin" || role === "superadmin",
    
    // Permisos de áreas
    canManageAreas: role === "superadmin",
    canViewAreas: role === "superadmin" || role === "admin",
    
    // Permisos de asignación
    canAssignUsers: role === "superadmin" || role === "admin",
    canAssignToProcess: role === "superadmin" || role === "admin",
    
    // Permisos de requerimientos/incidentes
    canCreateRequirement: role === "superadmin" || role === "admin",
    canEditRequirement: role === "superadmin" || role === "admin",
    canDeleteRequirement: role === "superadmin" || role === "admin",
    canCreateIncident: role === "superadmin" || role === "admin" || role === "user",
    canEditIncident: role === "superadmin" || role === "admin",
    canDeleteIncident: role === "superadmin" || role === "admin",
    canResolveIncident: role === "superadmin" || role === "admin",
    
    // Permisos de procesos
    canCreateProcess: role === "superadmin" || role === "admin",
    canEditProcess: role === "superadmin" || role === "admin",
    canDeleteProcess: role === "superadmin" || role === "admin",
    
    // Permisos de tareas/actividades
    canCreateTask: role === "superadmin" || role === "admin",
    canEditTask: role === "superadmin" || role === "admin",
    canDeleteTask: role === "superadmin" || role === "admin",
    canLogActivity: true, // Todos pueden registrar actividades
    
    // Permisos de dashboard
    canViewSuperAdminDashboard: role === "superadmin",
    canViewAdminDashboard: role === "admin" || role === "superadmin",
    canViewUserDashboard: true,
    
    // Permisos de configuración
    canAccessSettings: true,
    canManageSystemSettings: role === "superadmin",
    
    // Info del rol
    role,
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "admin",
    isUser: role === "user",
  };
};

export default usePermissions;
