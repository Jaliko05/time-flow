import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Pause,
  Play,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import TaskFormDialog from "./TaskFormDialog";

const TASK_COLUMNS = [
  { id: "backlog", label: "Backlog", icon: AlertCircle, color: "bg-slate-100" },
  { id: "assigned", label: "Asignado", icon: User, color: "bg-blue-100" },
  {
    id: "in_progress",
    label: "En Progreso",
    icon: Play,
    color: "bg-yellow-100",
  },
  { id: "paused", label: "Pausado", icon: Pause, color: "bg-orange-100" },
  {
    id: "completed",
    label: "Completado",
    icon: CheckCircle2,
    color: "bg-green-100",
  },
];

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "bg-blue-100 text-blue-800" },
  medium: { label: "Media", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-800" },
};

function TaskCard({ task, onEdit, onStatusChange }) {
  const { toast } = useToast();
  const priorityConfig =
    PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const progressPercentage = task.completion_percent || 0;
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  return (
    <Card
      className={cn(
        "mb-3 cursor-pointer hover:shadow-md transition-shadow",
        isOverdue && "border-red-300"
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Editar
              </DropdownMenuItem>
              {task.status !== "in_progress" && (
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "in_progress")}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </DropdownMenuItem>
              )}
              {task.status === "in_progress" && (
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "paused")}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </DropdownMenuItem>
              )}
              {task.status !== "completed" && (
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "completed")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={priorityConfig.color}>
              {priorityConfig.label}
            </Badge>
            {task.assigned_user && (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assigned_user.full_name}
              </Badge>
            )}
          </div>

          {task.due_date && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString("es-ES")}
              {isOverdue && " (Vencida)"}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.used_hours}h / {task.estimated_hours}h
              </span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  progressPercentage >= 100
                    ? "bg-green-600"
                    : progressPercentage >= 75
                    ? "bg-yellow-600"
                    : "bg-blue-600"
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskKanban({
  tasks = [],
  projectId,
  users = [],
  canEdit = true,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksAPI.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["projects"]);
      toast({
        title: "Estado actualizado",
        description: "El estado de la tarea se ha actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (taskId, newStatus) => {
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={handleCreateTask}>Nueva Tarea</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TASK_COLUMNS.map((column) => {
          const Icon = column.icon;
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div key={column.id} className="flex flex-col">
              <div className={cn("p-3 rounded-t-lg", column.color)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">{column.label}</h3>
                  </div>
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-b-lg min-h-[200px]">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay tareas
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={editingTask}
        projectId={projectId}
        users={users}
      />
    </div>
  );
}
