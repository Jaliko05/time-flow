import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, BarChart3, TrendingUp, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  const { data: areasSummary = [], isLoading: loadingAreas } = useQuery({
    queryKey: ["stats", "areas"],
    queryFn: () => statsAPI.getAreasSummary(),
    enabled: !!user && user.role === "superadmin",
  });

  const { data: usersSummary = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: () => statsAPI.getUsersSummary(),
    enabled: !!user && user.role === "superadmin",
  });

  const { data: projectsSummary = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["stats", "projects"],
    queryFn: () => statsAPI.getProjectsSummary(),
    enabled: !!user && user.role === "superadmin",
  });

  const totalUsers = areasSummary.reduce(
    (sum, area) => sum + area.total_users,
    0
  );
  const totalProjects = areasSummary.reduce(
    (sum, area) => sum + area.total_projects,
    0
  );
  const totalHours = areasSummary.reduce(
    (sum, area) => sum + area.total_hours,
    0
  );
  const totalActivities = areasSummary.reduce(
    (sum, area) => sum + area.total_activities,
    0
  );

  if (loadingAreas) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Panel SuperAdmin
            </h1>
            <p className="text-muted-foreground mt-1">
              Vista general del sistema
            </p>
          </div>
        </div>

        {/* Tarjetas de Resumen Global */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Áreas
              </CardTitle>
              <Briefcase className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {areasSummary.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                áreas activas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usuarios
              </CardTitle>
              <Users className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                trabajadores activos
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Proyectos
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalProjects}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                proyectos en el sistema
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Horas
              </CardTitle>
              <Clock className="w-4 h-4 text-orange-500" />
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
        </div>

        {/* Resumen por Áreas */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Áreas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Proyectos</TableHead>
                  <TableHead>Actividades</TableHead>
                  <TableHead>Horas Totales</TableHead>
                  <TableHead>Completitud Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areasSummary.map((area) => (
                  <TableRow key={area.area_id}>
                    <TableCell className="font-medium">
                      {area.area_name}
                    </TableCell>
                    <TableCell>{area.total_users}</TableCell>
                    <TableCell>
                      {area.active_projects} / {area.total_projects}
                    </TableCell>
                    <TableCell>{area.total_activities}</TableCell>
                    <TableCell>{area.total_hours.toFixed(1)}h</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={area.average_completion}
                          className="w-16"
                        />
                        <span className="text-sm">
                          {area.average_completion.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Más Activos</CardTitle>
          </CardHeader>
          <CardContent>
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
                {usersSummary
                  .sort((a, b) => b.total_hours - a.total_hours)
                  .slice(0, 10)
                  .map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.user_name}
                      </TableCell>
                      <TableCell>{user.user_email}</TableCell>
                      <TableCell>{user.total_activities}</TableCell>
                      <TableCell>{user.total_hours.toFixed(1)}h</TableCell>
                      <TableCell>{user.assigned_projects}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={user.average_completion}
                            className="w-16"
                          />
                          <span className="text-sm">
                            {user.average_completion.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Proyectos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
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
                {projectsSummary.map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell className="font-medium">
                      {project.project_name}
                    </TableCell>
                    <TableCell>
                      {project.assigned_user_name || "Sin asignar"}
                    </TableCell>
                    <TableCell>{project.estimated_hours.toFixed(1)}h</TableCell>
                    <TableCell>{project.used_hours.toFixed(1)}h</TableCell>
                    <TableCell>{project.remaining_hours.toFixed(1)}h</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={project.completion_percent}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
