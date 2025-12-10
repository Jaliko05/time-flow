import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useProjects } from "@/hooks/useProjects";
import ProjectList from "../components/projects/ProjectList";
import ProjectFormDialog from "../components/projects/ProjectFormDialog";

export default function Projects() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    isCreating,
    isUpdating,
  } = useProjects(user);

  const handleSaveProject = (data) => {
    if (editingProject) {
      updateProject(
        { id: editingProject.id, data },
        {
          onSuccess: () => {
            setEditingProject(null);
            setShowForm(false);
          },
        }
      );
    } else {
      createProject(data, {
        onSuccess: () => setShowForm(false),
      });
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

  const getPageTitle = () => {
    if (user?.role === "superadmin") return "Todos los Proyectos";
    return "Mis Proyectos";
  };

  const getPageSubtitle = () => {
    if (user?.role === "superadmin") {
      return "Vista general de todos los proyectos del sistema";
    }
    if (user?.role === "admin") {
      return `Proyectos del área: ${user?.area?.name || "Tu área"}`;
    }
    return "Gestiona tus proyectos personales y tareas";
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          actions={
            user?.role !== "superadmin" && (
              <Button onClick={handleNewProject} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Proyecto
              </Button>
            )
          }
        />

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
              onDelete={deleteProject}
            />
          </CardContent>
        </Card>

        <ProjectFormDialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingProject(null);
          }}
          project={editingProject}
          onSubmit={handleSaveProject}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </div>
  );
}
