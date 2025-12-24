import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProcess,
  getProcessActivities,
  updateProcessActivity,
  createProcessActivity,
} from "@/api/processes";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ProcessActivityForm from "@/components/processes/ProcessActivityForm";

const ACTIVITY_STATUSES = {
  backlog: {
    label: "Backlog",
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

function ActivityCard({ activity, onStatusChange, onClick, canEdit }) {
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

function StatusColumn({
  status,
  activities,
  onStatusChange,
  onActivityClick,
  canEdit,
}) {
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
          "p-3 rounded-b-lg border-2 border-t-0 min-h-[400px] space-y-2",
          "bg-background"
        )}
      >
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onStatusChange={onStatusChange}
            onClick={onActivityClick}
            canEdit={canEdit}
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

export default function ProcessDetail() {
  const { processId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const canEdit = user?.role === "admin" || user?.role === "superadmin";

  const { data: processData, isLoading: processLoading } = useQuery({
    queryKey: ["process", processId],
    queryFn: () => getProcess(processId),
    enabled: !!processId,
  });
  const process = processData?.data;

  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["process-activities", processId],
    queryFn: () => getProcessActivities(processId),
    enabled: !!processId,
  });
  const activities = activitiesData?.data || [];

  const updateActivityMutation = useMutation({
    mutationFn: ({ activityId, data }) =>
      updateProcessActivity(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["process-activities", processId]);
      toast({ title: "Actividad actualizada" });
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  const handleStatusChange = (activityId, newStatus) => {
    updateActivityMutation.mutate({ activityId, data: { status: newStatus } });
  };

  const handleActivityClick = (activity) => {
    navigate(`/process-activity/${activity.id}`);
  };

  const handleCreateActivity = async (data) => {
    try {
      await createProcessActivity(processId, data);
      refetchActivities();
      setShowActivityForm(false);
      toast({ title: "Actividad creada exitosamente" });
    } catch (err) {
      toast({ title: "Error al crear actividad", variant: "destructive" });
    }
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

  if (processLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Proceso no encontrado</h2>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{process.name}</h1>
            <p className="text-muted-foreground">{process.description}</p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowActivityForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
          )}
        </div>

        {/* Process Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Actividades
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
                {process.estimated_hours || 0}h
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

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <CardTitle>Actividades del Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                <StatusColumn
                  status="backlog"
                  activities={groupedActivities.backlog}
                  onStatusChange={handleStatusChange}
                  onActivityClick={handleActivityClick}
                  canEdit={canEdit}
                />
                <StatusColumn
                  status="assigned"
                  activities={groupedActivities.assigned}
                  onStatusChange={handleStatusChange}
                  onActivityClick={handleActivityClick}
                  canEdit={canEdit}
                />
                <StatusColumn
                  status="paused"
                  activities={groupedActivities.paused}
                  onStatusChange={handleStatusChange}
                  onActivityClick={handleActivityClick}
                  canEdit={canEdit}
                />
                <StatusColumn
                  status="completed"
                  activities={groupedActivities.completed}
                  onStatusChange={handleStatusChange}
                  onActivityClick={handleActivityClick}
                  canEdit={canEdit}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Form Dialog */}
        {showActivityForm && (
          <ProcessActivityForm
            open={showActivityForm}
            onOpenChange={setShowActivityForm}
            processId={parseInt(processId)}
            onSubmit={handleCreateActivity}
          />
        )}
      </div>
    </div>
  );
}
