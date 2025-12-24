import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  ListTodo,
  GripVertical,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACTIVITY_STATUSES = {
  backlog: {
    label: "Backlog",
    color: "bg-gray-100 border-gray-300 text-gray-700",
    icon: ListTodo,
  },
  pending: {
    label: "Pendiente",
    color: "bg-gray-100 border-gray-300 text-gray-700",
    icon: ListTodo,
  },
  assigned: {
    label: "Asignado",
    color: "bg-orange-50 border-orange-400 text-orange-700",
    icon: PlayCircle,
  },
  in_progress: {
    label: "En Progreso",
    color: "bg-blue-50 border-blue-400 text-blue-700",
    icon: PlayCircle,
  },
  paused: {
    label: "Detenido",
    color: "bg-red-50 border-red-400 text-red-700",
    icon: PauseCircle,
  },
  completed: {
    label: "Finalizado",
    color: "bg-green-50 border-green-400 text-green-700",
    icon: CheckCircle2,
  },
};

function ActivityCard({ activity, onClick }) {
  const status =
    ACTIVITY_STATUSES[activity.status] || ACTIVITY_STATUSES.backlog;
  const StatusIcon = status.icon;

  return (
    <div
      onClick={() => onClick(activity)}
      className={cn(
        "p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
        status.color
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <StatusIcon className="h-4 w-4" />
        </div>
        {activity.estimated_hours && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {activity.estimated_hours}h
          </Badge>
        )}
      </div>
      <h4 className="font-medium text-sm mb-1">{activity.name}</h4>
      {activity.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {activity.description}
        </p>
      )}
      {activity.assigned_user && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <Users className="h-3 w-3" />
          <span>{activity.assigned_user.full_name}</span>
        </div>
      )}
    </div>
  );
}

function StatusColumn({ status, activities, onActivityClick }) {
  const config = ACTIVITY_STATUSES[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex-1 min-w-[250px]">
      <div className={cn("p-3 rounded-t-lg border-2 border-b-0", config.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            <span className="font-semibold">{config.label}</span>
          </div>
          <Badge variant="secondary">{activities.length}</Badge>
        </div>
      </div>
      <div
        className={cn(
          "p-3 rounded-b-lg border-2 border-t-0 min-h-[300px] space-y-2",
          "bg-background"
        )}
      >
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onClick={onActivityClick}
          />
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Sin actividades
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canEdit = user?.role === "admin" || user?.role === "superadmin";

  // Obtener la tarea y sus sub-actividades
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksAPI.getById(taskId),
    enabled: !!taskId,
  });

  // Obtener actividades de la tarea (sub-tareas)
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["task-activities", taskId],
    queryFn: () => tasksAPI.getAll({ parent_id: taskId }),
    enabled: !!taskId,
  });

  const handleActivityClick = (activity) => {
    navigate(`/task-activity/${activity.id}`);
  };

  // Agrupar actividades por estado
  const groupedActivities = {
    backlog: activities.filter(
      (a) => a.status === "backlog" || a.status === "pending"
    ),
    assigned: activities.filter((a) => a.status === "assigned"),
    paused: activities.filter(
      (a) => a.status === "paused" || a.status === "blocked"
    ),
    completed: activities.filter((a) => a.status === "completed"),
  };

  if (taskLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Actividad no encontrada</h2>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const statusConfig =
    ACTIVITY_STATUSES[task.status] || ACTIVITY_STATUSES.backlog;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                ACT-{task.id}
              </Badge>
              <Badge className={cn(statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{task.name}</h1>
            {task.description && (
              <p className="text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>
          {canEdit && (
            <Button
              onClick={() =>
                toast({ title: "Crear sub-actividad - próximamente" })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sub-Actividad
            </Button>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Sub-Actividades
                </span>
                <ListTodo className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{activities.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Horas Estimadas
                </span>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {task.estimated_hours || 0}h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Completadas
                </span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {groupedActivities.completed.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progreso</span>
                <AlertCircle className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {activities.length > 0
                  ? Math.round(
                      (groupedActivities.completed.length / activities.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban de Sub-Actividades */}
        <Card>
          <CardHeader>
            <CardTitle>Sub-Actividades de la Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activities.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                <StatusColumn
                  status="backlog"
                  activities={groupedActivities.backlog}
                  onActivityClick={handleActivityClick}
                />
                <StatusColumn
                  status="assigned"
                  activities={groupedActivities.assigned}
                  onActivityClick={handleActivityClick}
                />
                <StatusColumn
                  status="paused"
                  activities={groupedActivities.paused}
                  onActivityClick={handleActivityClick}
                />
                <StatusColumn
                  status="completed"
                  activities={groupedActivities.completed}
                  onActivityClick={handleActivityClick}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground mb-4">
                  Esta tarea no tiene sub-actividades definidas.
                </p>
                <p className="text-sm text-muted-foreground">
                  Las sub-actividades permiten dividir la tarea en pasos más
                  pequeños.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
