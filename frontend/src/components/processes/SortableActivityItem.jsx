import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-gray-100 text-gray-700",
  },
  in_progress: {
    label: "En Progreso",
    icon: Clock,
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Completado",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700",
  },
  blocked: {
    label: "Bloqueado",
    icon: AlertCircle,
    className: "bg-red-100 text-red-700",
  },
};

export default function SortableActivityItem({ activity, onEdit, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = statusConfig[activity.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "mb-2 cursor-pointer hover:shadow-md transition-shadow",
          isDragging && "shadow-lg"
        )}
        onClick={() => onEdit && onEdit(activity)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className={cn(
                "cursor-grab active:cursor-grabbing",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Activity Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{activity.name}</h4>
                <Badge className={cn("ml-2", status.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {activity.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {activity.assigned_user && (
                  <span>Asignado: {activity.assigned_user.name}</span>
                )}
                {activity.dependencies && activity.dependencies.length > 0 && (
                  <span>📎 {activity.dependencies.length} dependencias</span>
                )}
                {activity.estimated_hours && (
                  <span>⏱️ {activity.estimated_hours}h</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
