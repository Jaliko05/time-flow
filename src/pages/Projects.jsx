import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

import ProjectList from "../components/projects/ProjectList";
import ProjectFormDialog from "../components/projects/ProjectFormDialog";

export default function Projects() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ 
      created_by: user?.email 
    }, '-created_date'),
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create({
      ...data,
      created_by: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
      setShowForm(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Proyectos</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus proyectos personales
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
              Proyectos ({projects.filter(p => p.is_active).length})
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
            isSubmitting={createProjectMutation.isPending || updateProjectMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}