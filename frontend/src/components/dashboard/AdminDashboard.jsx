import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statsAPI, projectsAPI, usersAPI } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  Plus,
  ListTodo,
  FolderKanban,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "../ui/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: usersSummary = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["stats", "users", user?.area_id],
    queryFn: () => statsAPI.getUsersSummary({ area_id: user?.area_id }),
    enabled: !!user && user.role === "admin" && !!user.area_id,
  });

  const { data: projectsSummary = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["stats", "projects", user?.area_id],
    queryFn: () => statsAPI.getProjectsSummary({ area_id: user?.area_id }),
    enabled: !!user && user.role === "admin" && !!user.area_id,
  });

  // Obtener proyectos del área para el Kanban
  const { data: areaProjects = [], isLoading: loadingAreaProjects } = useQuery({
    queryKey: ["projects", user?.area_id],
    queryFn: () => projectsAPI.getAll(),
    enabled: !!user && user.role === "admin",
  });

  // Obtener usuarios del área para asignar proyectos
  const { data: areaUsers = [] } = useQuery({
    queryKey: ["users", user?.area_id],
    queryFn: () => usersAPI.getAll({ area_id: user.area_id }),
    enabled: !!user && user.role === "admin" && !!user.area_id,
  });

  const totalUsers = usersSummary?.length || 0;
  const totalProjects = projectsSummary?.length || 0;
  const activeProjects =
    projectsSummary?.filter((p) => p.is_active).length || 0;
  const totalHours =
    usersSummary?.reduce((sum, user) => sum + user.total_hours, 0) || 0;
  const totalActivities =
    usersSummary?.reduce((sum, user) => sum + user.total_activities, 0) || 0;

  if (loadingUsers || loadingProjects) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Panel de Administrador
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.area?.name || "Gestión de área"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="backlog" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Backlog de Proyectos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Tarjetas de Resumen del Área */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trabajadores
                </CardTitle>
                <Users className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">en tu área</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Proyectos
                </CardTitle>
                <Briefcase className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {activeProjects} / {totalProjects}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  proyectos activos
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Horas Totales
                </CardTitle>
                <Clock className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalHours.toFixed(0)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalActivities} actividades
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Productividad
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalUsers > 0 ? (totalHours / totalUsers).toFixed(1) : 0}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  promedio por usuario
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de Trabajadores */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Trabajadores</CardTitle>
            </CardHeader>
            <CardContent>
              {(usersSummary?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay trabajadores en tu área aún
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actividades</TableHead>
                      <TableHead>Horas Totales</TableHead>
                      <TableHead>Proyectos Asignados</TableHead>
                      <TableHead>Completitud Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(usersSummary || [])
                      .sort((a, b) => b.total_hours - a.total_hours)
                      .map((worker) => (
                        <TableRow key={worker.user_id}>
                          <TableCell className="font-medium">
                            {worker.user_name}
                          </TableCell>
                          <TableCell>{worker.user_email}</TableCell>
                          <TableCell>{worker.total_activities}</TableCell>
                          <TableCell>
                            {worker.total_hours.toFixed(1)}h
                          </TableCell>
                          <TableCell>{worker.assigned_projects}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={worker.average_completion}
                                className="w-16"
                              />
                              <span className="text-sm">
                                {worker.average_completion.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Proyectos del Área */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Proyectos del Área</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(projectsSummary?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay proyectos en tu área aún. Crea el primero en el
                  Backlog.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Asignado a</TableHead>
                      <TableHead>Horas Estimadas</TableHead>
                      <TableHead>Horas Usadas</TableHead>
                      <TableHead>Horas Restantes</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(projectsSummary || []).map((project) => (
                      <TableRow key={project.project_id}>
                        <TableCell className="font-medium">
                          {project.project_name}
                        </TableCell>
                        <TableCell>
                          {project.assigned_user_name || "Sin asignar"}
                        </TableCell>
                        <TableCell>
                          {project.estimated_hours.toFixed(1)}h
                        </TableCell>
                        <TableCell>{project.used_hours.toFixed(1)}h</TableCell>
                        <TableCell>
                          <span
                            className={
                              project.remaining_hours < 0
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {project.remaining_hours.toFixed(1)}h
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(project.completion_percent, 100)}
                              className="w-20"
                            />
                            <span className="text-sm">
                              {project.completion_percent.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.is_active ? (
                            <span className="text-green-600 font-medium">
                              Activo
                            </span>
                          ) : (
                            <span className="text-gray-400">Inactivo</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Backlog */}
        <TabsContent value="backlog" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Proyectos del Área</h2>
              <p className="text-sm text-gray-600">
                Vista general de los proyectos del área. Usa la sección
                Proyectos para gestión completa.
              </p>
            </div>
            <Button onClick={() => navigate("/Projects")}>
              <FolderKanban className="h-4 w-4 mr-2" />
              Ver Todos los Proyectos
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Proyectos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {(areaProjects || []).length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    No hay proyectos en tu área
                  </p>
                  <Button onClick={() => navigate("/Projects")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Proyecto
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(areaProjects || []).slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/Projects/${project.id}`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-sm text-gray-600">
                          {project.used_hours?.toFixed(1) || 0}h /{" "}
                          {project.estimated_hours || 0}h
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver Planner
                      </Button>
                    </div>
                  ))}
                  {(areaProjects || []).length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/Projects")}
                    >
                      Ver todos los {areaProjects.length} proyectos
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
