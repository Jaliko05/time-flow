import { ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { filterActiveProjects } from "@/utils/helpers";

/**
 * Componente que muestra los proyectos activos del usuario
 * donde puede registrar actividades
 */
export function ActiveProjectsList({ projects = [] }) {
  const activeProjects = filterActiveProjects(projects);

  if (activeProjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No tienes proyectos activos para registrar actividades.</p>
        <p className="text-sm">
          Crea un proyecto personal o mueve tus proyectos a "En Ejecución"
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {activeProjects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <p className="font-medium text-sm">{project.name}</p>
            <p className="text-xs text-gray-600">
              {project.used_hours?.toFixed(1) || 0}h /{" "}
              {project.estimated_hours || 0}h
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
