import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PriorityBadge } from "@/components/common/Badges";
import { Edit, Trash2, Eye, Clock, Users, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateProjectProgress } from "@/utils/helpers";
import { PROJECT_TYPES } from "@/constants";
import { UserAvatarGroup } from "@/components/common/UserAvatar";

/**
 * Componente individual de tarjeta de proyecto
 */
export function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate();
  const progressPercent = calculateProjectProgress(project);

  const handleCardClick = (e) => {
    // Evitar navegación si se hace clic en botones de acción
    if (e.target.closest("button")) return;
    navigate(`/projects/${project.id}`);
  };

  return (
    <div
      className="border-2 border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Barra de color superior */}
      <div
        className="h-2 rounded-t-md"
        style={{ backgroundColor: project.color || "#3b82f6" }}
      />

      <div className="p-4">
        {/* Título y Estado */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || "Sin descripción"}
            </p>
          </div>
        </div>

        {/* Badges: Estado y Prioridad */}
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={project.status} />
          {project.priority && <PriorityBadge priority={project.priority} />}
          {project.project_type && (
            <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              {PROJECT_TYPES[project.project_type] || project.project_type}
            </span>
          )}
          {/* Multi-Area Support */}
          {project.areas && project.areas.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {project.areas.slice(0, 2).map((area) => (
                <span
                  key={area.id}
                  className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700"
                >
                  {area.name}
                </span>
              ))}
              {project.areas.length > 2 && (
                <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                  +{project.areas.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        {project.estimated_hours && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horas
              </span>
              <span>
                {project.used_hours?.toFixed(1) || 0} /{" "}
                {project.estimated_hours}h
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Metadatos adicionales */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Show assigned users */}
            {(project.assigned_users?.length > 0 || project.assigned_user) && (
              <div className="flex items-center gap-1">
                <UserAvatarGroup
                  users={
                    project.assigned_users ||
                    (project.assigned_user ? [project.assigned_user] : [])
                  }
                  size="sm"
                  maxVisible={3}
                />
              </div>
            )}
            {project.task_count !== undefined && (
              <div className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                <span>{project.task_count} tareas</span>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project.id}`);
            }}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("¿Estás seguro de eliminar este proyecto?")) {
                onDelete(project.id);
              }
            }}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
