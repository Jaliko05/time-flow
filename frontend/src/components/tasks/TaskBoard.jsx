import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, User, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TASK_COLUMNS = [
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

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "bg-gray-200 text-gray-700", icon: "🔵" },
  medium: { label: "Media", color: "bg-blue-200 text-blue-700", icon: "🟡" },
  high: { label: "Alta", color: "bg-orange-200 text-orange-700", icon: "🟠" },
  critical: { label: "Crítica", color: "bg-red-200 text-red-700", icon: "🔴" },
};

function TaskCard({ task, onEdit, onStatusChange, users = [] }) {
  const [isDragging, setIsDragging] = useState(false);
  const priorityConfig =
    PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const assignedUser = users.find(
    (u) => u.id === task.assigned_user_id || u.id === task.assigned_to
  );
  const taskTitle = task.title || task.name;

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.setData("currentStatus", task.status);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(task)}
      className={cn(
        "bg-white rounded-lg border-2 p-3 mb-3 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50",
        isOverdue && "border-red-300"
      )}
    >
      {/* Header: Título y Prioridad */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm flex-1 line-clamp-2">
          {taskTitle}
        </h4>
        <Badge
          variant="secondary"
          className={cn("text-xs whitespace-nowrap", priorityConfig.color)}
        >
          {priorityConfig.icon} {priorityConfig.label}
        </Badge>
      </div>

      {/* Descripción */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {/* Usuario Asignado */}
        {assignedUser && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">
              {assignedUser.full_name}
            </span>
          </div>
        )}

        {/* Horas Estimadas */}
        {task.estimated_hours > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{task.estimated_hours}h</span>
          </div>
        )}

        {/* Fecha de Vencimiento */}
        {task.due_date && (
          <div
            className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-600 font-semibold"
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(task.due_date), "dd MMM", { locale: es })}
            </span>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskColumn({
  column,
  tasks = [],
  onEdit,
  onStatusChange,
  onAddTask,
  users = [],
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const currentStatus = e.dataTransfer.getData("currentStatus");

    if (currentStatus !== column.id) {
      onStatusChange(taskId, column.id);
    }
  };

  const columnTasks = tasks.filter((t) => t.status === column.id);

  return (
    <div
      className={cn("flex-1 min-w-[280px] max-w-[320px]")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card
        className={cn(
          "h-full border-2 transition-colors",
          column.color,
          isDragOver && "ring-2 ring-blue-500"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {column.label}
                <Badge variant="outline" className="ml-1">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">{column.description}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 max-h-[600px] overflow-y-auto">
          {columnTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p>No hay tareas</p>
              <p className="text-xs">Arrastra aquí o crea una nueva</p>
            </div>
          ) : (
            columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                users={users}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TaskBoard({
  tasks = [],
  onEditTask,
  onCreateTask,
  users = [],
  isLoading = false,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutación para actualizar estado de tarea
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksAPI.update(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
      toast({
        title: "Tarea actualizada",
        description: "El estado de la tarea se actualizó correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (taskId, newStatus) => {
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleAddTask = (status) => {
    onCreateTask(status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando tareas...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_COLUMNS.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={tasks}
            onEdit={onEditTask}
            onStatusChange={handleStatusChange}
            onAddTask={handleAddTask}
            users={users}
          />
        ))}
      </div>
    </div>
  );
}
