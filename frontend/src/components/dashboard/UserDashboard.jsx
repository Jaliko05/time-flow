import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Plus, ListTodo, CalendarCheck } from "lucide-react";
import { useToast } from "../ui/use-toast";
import ProjectKanban from "../projects/ProjectKanban";
import ProjectFormDialog from "../projects/ProjectFormDialog";
import QuickActivityForm from "./QuickActivityForm";
import TodayActivities from "./TodayActivities";
import { projectsAPI } from "../../api";

export default function UserDashboard({ user }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("activities");

  // Obtener proyectos del usuario
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsAPI.getAll(),
  });

  // Filtrar proyectos: personales del usuario + proyectos de área asignados
  const userProjects = projects.filter(
    (p) =>
      (p.project_type === "personal" && p.created_by === user.id) ||
      (p.project_type === "area" && p.assigned_user_id === user.id)
  );

  // Proyectos que pueden usarse para registrar actividades
  const activeProjects = userProjects.filter(
    (p) => p.status === "in_progress" || p.status === "completed"
  );

  // Mutación para crear proyecto
  const createProjectMutation = useMutation({
    mutationFn: (data) => {
      console.log("Enviando proyecto:", data);
      return projectsAPI.create(data);
    },
    onSuccess: (result) => {
      console.log("Proyecto creado:", result);
      queryClient.invalidateQueries(["projects"]);
      toast({
        title: "Éxito",
        description: "Proyecto creado correctamente",
      });
      setShowProjectDialog(false);
    },
    onError: (error) => {
      console.error("Error al crear proyecto:", error);
      console.error("Response data:", error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear proyecto",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">¡Hola, {user.full_name}! 👋</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus proyectos y registra tus actividades diarias
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Actividades del Día
          </TabsTrigger>
          <TabsTrigger value="backlog" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Mis Proyectos (Backlog)
          </TabsTrigger>
        </TabsList>

        {/* Tab: Actividades del Día */}
        <TabsContent value="activities" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Formulario de actividad rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Registrar Actividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActivityForm user={user} />
              </CardContent>
            </Card>

            {/* Actividades de hoy */}
            <Card>
              <CardHeader>
                <CardTitle>Actividades de Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <TodayActivities userId={user.id} />
              </CardContent>
            </Card>
          </div>

          {/* Info sobre proyectos activos */}
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Disponibles para Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Solo puedes registrar actividades en proyectos que estén{" "}
                <span className="font-semibold text-yellow-600">
                  En Ejecución
                </span>{" "}
                o{" "}
                <span className="font-semibold text-green-600">
                  Completados
                </span>
                .
              </p>
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tienes proyectos activos para registrar actividades.</p>
                  <p className="text-sm">
                    Crea un proyecto personal o mueve tus proyectos a "En
                    Ejecución"
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {activeProjects.map((project) => (
                    <div
                      key={project.id}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-gray-600">
                        {project.used_hours.toFixed(1)}h /{" "}
                        {project.estimated_hours}h
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backlog de Proyectos */}
        <TabsContent value="backlog" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Mis Proyectos</h2>
              <p className="text-sm text-gray-600">
                Arrastra los proyectos entre columnas para cambiar su estado
              </p>
            </div>
            <Button onClick={() => setShowProjectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto Personal
            </Button>
          </div>

          <ProjectKanban projects={userProjects} isLoading={loadingProjects} />
        </TabsContent>
      </Tabs>

      {/* Dialog para crear proyecto */}
      <ProjectFormDialog
        open={showProjectDialog}
        onClose={() => setShowProjectDialog(false)}
        onSave={(data) => {
          // Forzar project_type = 'personal' para usuarios comunes
          createProjectMutation.mutate({
            ...data,
            project_type: "personal",
          });
        }}
        isSubmitting={createProjectMutation.isLoading}
        userRole="user"
      />
    </div>
  );
}
