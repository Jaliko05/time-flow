import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, GripVertical, User, Clock, CheckCircle2 } from "lucide-react";
import { projectsAPI } from "../../api";
import { useToast } from "../ui/use-toast";

const PROJECT_STATUSES = [
  { value: "unassigned", label: "Sin Asignar", color: "bg-gray-100" },
  { value: "assigned", label: "Asignado", color: "bg-blue-100" },
  { value: "in_progress", label: "En Ejecución", color: "bg-yellow-100" },
  { value: "paused", label: "Pausado", color: "bg-orange-100" },
  { value: "completed", label: "Completado", color: "bg-green-100" },
];

const PROJECT_TYPE_LABELS = {
  personal: "Personal",
  area: "Área",
};

function ProjectCard({ project, onDragStart }) {
  const getProgressColor = (percent) => {
    if (percent >= 100) return "bg-green-500";
    if (percent >= 75) return "bg-blue-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, project)}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-move mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <h4 className="font-semibold text-sm">{project.name}</h4>
          </div>
          {project.description && (
            <p className="text-xs text-gray-600 ml-6">{project.description}</p>
          )}
        </div>
        <Badge variant="outline" className="ml-2 text-xs">
          {PROJECT_TYPE_LABELS[project.project_type] || project.project_type}
        </Badge>
      </div>

      {project.assigned_user && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mt-2 ml-6">
          <User className="h-3 w-3" />
          <span>{project.assigned_user.full_name}</span>
        </div>
      )}

      <div className="mt-3 ml-6 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              {project.used_hours.toFixed(1)}h /{" "}
              {project.estimated_hours.toFixed(1)}h
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-gray-600" />
            <span className="font-medium">
              {project.completion_percent.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(
              project.completion_percent
            )}`}
            style={{ width: `${Math.min(project.completion_percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, projects, onDrop, onDragOver, onDragStart }) {
  return (
    <div className="flex-1 min-w-[250px]">
      <Card className={`h-full ${status.color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{status.label}</span>
            <Badge variant="secondary" className="ml-2">
              {projects.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent
          onDrop={(e) => onDrop(e, status.value)}
          onDragOver={onDragOver}
          className="space-y-2 min-h-[400px]"
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDragStart={onDragStart}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProjectKanban({ projects, isLoading }) {
  const [draggedProject, setDraggedProject] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: ({ projectId, status }) =>
      projectsAPI.updateStatus(projectId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      toast({
        title: "Éxito",
        description: "Estado del proyecto actualizado",
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

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();

    if (!draggedProject || draggedProject.status === newStatus) {
      setDraggedProject(null);
      return;
    }

    updateStatusMutation.mutate({
      projectId: draggedProject.id,
      status: newStatus,
    });

    setDraggedProject(null);
  };

  const getProjectsByStatus = (status) => {
    return projects.filter((p) => p.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PROJECT_STATUSES.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status}
            projects={getProjectsByStatus(status.value)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
}
