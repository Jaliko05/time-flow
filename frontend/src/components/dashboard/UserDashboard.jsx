import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ListTodo, CalendarCheck, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { PageHeader } from "../common/PageHeader";
import { EmptyState } from "../common/EmptyState";
import { ActiveProjectsList } from "./ActiveProjectsList";
import { useUserProjects } from "@/hooks/useProjects";
import ProjectKanban from "../projects/ProjectKanban";
import ProjectFormDialog from "../projects/ProjectFormDialog";
import QuickActivityForm from "./QuickActivityForm";
import TodayActivities from "./TodayActivities";
import DailyProgressBar from "./DailyProgressBar";
import { useQuery } from "@tanstack/react-query";
import { activitiesAPI } from "@/api";
import { format } from "date-fns";

export default function UserDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("activities");
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    projects,
    isLoading: loadingProjects,
    createProject,
    isCreating,
  } = useUserProjects(user);

  // Obtener actividades del día para calcular horas
  const { data: todayActivities = [] } = useQuery({
    queryKey: ["activities", user.id, today],
    queryFn: () => activitiesAPI.getAll({ date: today }),
    enabled: !!user?.id,
  });

  // Calcular horas totales del día
  const totalHoursToday = todayActivities.reduce(
    (sum, activity) => sum + parseFloat(activity.execution_time || 0),
    0
  );

  // Meta diaria (puedes ajustar esto según tus necesidades, por defecto 8 horas)
  const dailyGoal = 8;

  const handleCreateProject = (data) => {
    createProject(
      {
        ...data,
        project_type: "personal",
        creator_id: user.id,
        area_id: user.area_id,
      },
      {
        onSuccess: () => setShowProjectDialog(false),
      }
    );
  };

  // Todos los proyectos que puede ver el usuario
  const userProjects = projects;

  // Proyectos que pueden usarse para registrar actividades
  const activeProjects = userProjects.filter(
    (p) => p.status === "in_progress" || p.status === "completed"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`¡Hola, ${user.full_name}! 👋`}
        subtitle="Gestiona tus proyectos y registra tus actividades diarias"
      />

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
          {/* Barra de progreso diario */}
          <DailyProgressBar current={totalHoursToday} expected={dailyGoal} />

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
              <ActiveProjectsList projects={projects} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backlog de Proyectos */}
        <TabsContent value="backlog" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Proyectos</h2>
              <p className="text-sm text-gray-600">
                Proyectos personales y asignados por tu administrador
              </p>
            </div>
            <Button onClick={() => setShowProjectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto Personal
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={<ListTodo className="h-12 w-12" />}
                  title="No tienes proyectos aún"
                  description="Crea un proyecto personal o espera a que tu administrador te asigne uno"
                />
              </CardContent>
            </Card>
          ) : (
            <ProjectKanban projects={projects} isLoading={loadingProjects} />
          )}
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        onSubmit={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}
