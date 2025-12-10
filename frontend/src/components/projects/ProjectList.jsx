import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  FolderKanban,
  Eye,
  Clock,
  Users,
  ListTodo,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_CONFIG = {
  unassigned: {
    label: "Sin asignar",
    color: "bg-gray-100 text-gray-800 border-gray-300",
  },
  assigned: {
    label: "Asignado",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  in_progress: {
    label: "En progreso",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  paused: {
    label: "Pausado",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  completed: {
    label: "Completado",
    color: "bg-green-100 text-green-800 border-green-300",
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Media", color: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítica", color: "bg-red-100 text-red-700" },
};

export default function ProjectList({ projects, isLoading, onEdit, onDelete }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.is_active);

  if (activeProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No tienes proyectos creados</p>
        <p className="text-sm text-muted-foreground mt-2">
          Crea tu primer proyecto para organizar mejor tus actividades
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeProjects.map((project) => {
        const statusConfig =
          STATUS_CONFIG[project.status] || STATUS_CONFIG.unassigned;
        const priorityConfig =
          PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
        const progressPercent = project.completion_percent || 0;

        return (
          <div
            key={project.id}
            className="border-2 border-border rounded-lg hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            {/* Header con color */}
            <div
              className="h-2 rounded-t-md"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            />

            <div className="p-4">
              {/* Título y Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
                    {project.name}
                  </h3>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Descripción */}
              {project.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-2 mb-3">
                {/* Prioridad */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prioridad:</span>
                  <Badge variant="secondary" className={priorityConfig.color}>
                    {priorityConfig.label}
                  </Badge>
                </div>

                {/* Tipo */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="outline">
                    {project.project_type === "personal" ? "Personal" : "Área"}
                  </Badge>
                </div>

                {/* Horas */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {project.used_hours?.toFixed(1) || 0}h /{" "}
                        {project.estimated_hours || 0}h
                      </span>
                      <span className="text-xs font-medium">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tareas (si tiene) */}
                {project.task_count !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ListTodo className="h-4 w-4" />
                      <span>Tareas</span>
                    </div>
                    <span className="font-medium">
                      {project.task_count || 0}
                    </span>
                  </div>
                )}

                {/* Asignado a */}
                {project.assigned_user && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Asignado</span>
                    </div>
                    <span className="font-medium text-xs truncate max-w-[120px]">
                      {project.assigned_user.full_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Planner
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("¿Estás seguro de eliminar este proyecto?")) {
                      onDelete(project.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
