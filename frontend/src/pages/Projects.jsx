import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { projectsAPI } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

import ProjectList from "../components/projects/ProjectList";
import ProjectFormDialog from "../components/projects/ProjectFormDialog";

export default function Projects() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: async () => {
      const params = {};

      // Users see only their own projects
      if (user?.role === "user") {
        params.creator_id = user.id;
      }
      // Admins see projects from their area
      else if (user?.role === "admin" && user?.area_id) {
        params.area_id = user.area_id;
      }
      // SuperAdmin sees all projects (no filter)

      return await projectsAPI.getAll(params);
    },
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) =>
      projectsAPI.create({
        ...data,
        creator_id: user.id,
        area_id: user.area_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => projectsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
      setShowForm(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleSaveProject = (data) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Mis Proyectos
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === "superadmin"
                ? "Todos los proyectos del sistema"
                : user?.role === "admin"
                ? `Proyectos del área: ${user?.area?.name || "Tu área"}`
                : "Gestiona tus proyectos personales"}
            </p>
          </div>
          <Button onClick={handleNewProject} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FolderKanban className="w-5 h-5" />
              Proyectos ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectList
              projects={projects}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={(id) => deleteProjectMutation.mutate(id)}
            />
          </CardContent>
        </Card>

        {showForm && (
          <ProjectFormDialog
            project={editingProject}
            open={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
            onSave={handleSaveProject}
            isSubmitting={
              createProjectMutation.isPending || updateProjectMutation.isPending
            }
          />
        )}
      </div>
    </div>
  );
}
