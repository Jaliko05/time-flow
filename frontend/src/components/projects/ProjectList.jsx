import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FolderKanban, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-3">
      {activeProjects.map((project) => (
        <div
          key={project.id}
          className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h3 className="font-semibold text-foreground">
                  {project.name}
                </h3>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/projects/${project.id}`)}
                title="Ver detalles"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(project)}
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(project.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
