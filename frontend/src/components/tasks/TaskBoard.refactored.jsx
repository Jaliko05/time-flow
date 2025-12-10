import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/common/Loader";
import { TASK_COLUMNS } from "@/constants";
import { TaskColumn } from "./TaskColumn";

/**
 * Componente principal del tablero Kanban de tareas refactorizado
 * Separado en componentes más pequeños y reutilizables
 */
export default function TaskBoard({
  tasks = [],
  onEditTask,
  onCreateTask,
  users = [],
  isLoading = false,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    return <Loader size="lg" text="Cargando tareas..." className="h-64" />;
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
