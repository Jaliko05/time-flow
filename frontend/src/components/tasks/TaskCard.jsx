import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/common/Badges";
import { Clock, User, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isOverdue as checkIsOverdue } from "@/utils/helpers";

/**
 * Componente de tarjeta individual de tarea para el Kanban
 */
export function TaskCard({ task, onEdit, users = [] }) {
  const [isDragging, setIsDragging] = useState(false);

  const assignedUser = users.find(
    (u) => u.id === task.assigned_user_id || u.id === task.assigned_to
  );
  const taskTitle = task.title || task.name;
  const isTaskOverdue =
    checkIsOverdue(task.due_date) && task.status !== "completed";

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.setData("currentStatus", task.status);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(task)}
      className={cn(
        "bg-white rounded-lg border-2 p-3 mb-3 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50",
        isTaskOverdue && "border-red-300"
      )}
    >
      {/* Header: Título y Prioridad */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm flex-1 line-clamp-2">
          {taskTitle}
        </h4>
        {task.priority && <PriorityBadge priority={task.priority} />}
      </div>

      {/* Descripción */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {assignedUser && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">
              {assignedUser.full_name}
            </span>
          </div>
        )}

        {task.estimated_hours > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{task.estimated_hours}h</span>
          </div>
        )}

        {task.due_date && (
          <div
            className={cn(
              "flex items-center gap-1",
              isTaskOverdue && "text-red-600 font-semibold"
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(task.due_date), "dd MMM", { locale: es })}
            </span>
            {isTaskOverdue && <AlertCircle className="h-3 w-3" />}
          </div>
        )}
      </div>
    </div>
  );
}
