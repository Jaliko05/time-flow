import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Agregar una nueva notificación
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    return newNotification.id;
  }, []);

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  // Limpiar todas las notificaciones
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Obtener notificaciones no leídas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

// Tipos de notificaciones predefinidos
export const NOTIFICATION_TYPES = {
  DEPENDENCY_COMPLETED: "dependency_completed",
  TASK_ASSIGNED: "task_assigned",
  PROCESS_ASSIGNED: "process_assigned",
  PROJECT_STATUS_CHANGED: "project_status_changed",
  DEADLINE_APPROACHING: "deadline_approaching",
  INCIDENT_REPORTED: "incident_reported",
  COMMENT_ADDED: "comment_added",
  ACTIVITY_BLOCKED: "activity_blocked",
  ACTIVITY_UNBLOCKED: "activity_unblocked",
};

// Helper para crear notificaciones con tipo
export const createNotification = (type, data) => {
  const typeConfig = {
    [NOTIFICATION_TYPES.DEPENDENCY_COMPLETED]: {
      title: "Dependencia completada",
      message: `La actividad "${data?.activityName}" ha sido desbloqueada`,
      icon: "check-circle",
      variant: "success",
    },
    [NOTIFICATION_TYPES.TASK_ASSIGNED]: {
      title: "Nueva tarea asignada",
      message: `Se te ha asignado la tarea "${data?.taskName}"`,
      icon: "clipboard",
      variant: "info",
    },
    [NOTIFICATION_TYPES.PROCESS_ASSIGNED]: {
      title: "Asignado a proceso",
      message: `Has sido asignado al proceso "${data?.processName}"`,
      icon: "users",
      variant: "info",
    },
    [NOTIFICATION_TYPES.PROJECT_STATUS_CHANGED]: {
      title: "Estado de proyecto actualizado",
      message: `El proyecto "${data?.projectName}" cambió a ${data?.newStatus}`,
      icon: "folder",
      variant: "default",
    },
    [NOTIFICATION_TYPES.DEADLINE_APPROACHING]: {
      title: "Deadline próximo",
      message: `La tarea "${data?.taskName}" vence ${data?.dueIn}`,
      icon: "clock",
      variant: "warning",
    },
    [NOTIFICATION_TYPES.INCIDENT_REPORTED]: {
      title: "Nuevo incidente reportado",
      message: `Incidente "${data?.incidentName}" - Severidad: ${data?.severity}`,
      icon: "alert-triangle",
      variant: "destructive",
    },
    [NOTIFICATION_TYPES.COMMENT_ADDED]: {
      title: "Nuevo comentario",
      message: `${data?.userName} comentó en "${data?.itemName}"`,
      icon: "message-square",
      variant: "default",
    },
    [NOTIFICATION_TYPES.ACTIVITY_BLOCKED]: {
      title: "Actividad bloqueada",
      message: `La actividad "${data?.activityName}" está bloqueada por dependencias`,
      icon: "lock",
      variant: "warning",
    },
    [NOTIFICATION_TYPES.ACTIVITY_UNBLOCKED]: {
      title: "Actividad desbloqueada",
      message: `La actividad "${data?.activityName}" puede iniciarse`,
      icon: "unlock",
      variant: "success",
    },
  };

  const config = typeConfig[type] || {
    title: "Notificación",
    message: data?.message || "",
    icon: "bell",
    variant: "default",
  };

  return {
    type,
    ...config,
    data,
  };
};

export default NotificationContext;
