import { FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectCard } from "./ProjectCard";

/**
 * Componente refactorizado de lista de proyectos
 * Usa ProjectCard para cada proyecto individual
 */
export default function ProjectList({ projects, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.is_active);

  if (activeProjects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="w-12 h-12" />}
        title="No tienes proyectos creados"
        description="Crea tu primer proyecto para organizar mejor tus actividades"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
