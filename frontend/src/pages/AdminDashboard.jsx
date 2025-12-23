import { useEffect, useState } from "react";
import { Users, FolderKanban, UserCheck, Clock } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import BarChart from "@/components/charts/BarChart";
import PieChart from "@/components/charts/PieChart";
import ProgressBar from "@/components/dashboard/ProgressBar";
import { getAdminDashboard } from "@/api/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboard();
      setMetrics(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar métricas");
      console.error("Error loading metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  // Transform data for charts
  const projectsByStatusData = Object.entries(
    metrics.projects_by_status || {}
  ).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Admin</h2>
        <p className="text-muted-foreground">
          Vista de tu área: {metrics.area_name || "N/A"}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Proyectos del Área"
          value={metrics.total_projects || 0}
          icon={FolderKanban}
          color="blue"
          description={`${metrics.active_projects || 0} activos`}
        />
        <MetricCard
          title="Usuarios del Área"
          value={metrics.total_users || 0}
          icon={Users}
          color="green"
          description="Miembros del equipo"
        />
        <MetricCard
          title="Usuarios Disponibles"
          value={metrics.available_users || 0}
          icon={UserCheck}
          color="purple"
          description="Sin procesos activos"
        />
        <MetricCard
          title="Horas Trabajadas"
          value={metrics.total_hours || 0}
          icon={Clock}
          color="orange"
          description="Este mes"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {projectsByStatusData.length > 0 && (
          <PieChart
            data={projectsByStatusData}
            title="Proyectos por Estado"
            nameKey="name"
            valueKey="value"
          />
        )}

        {/* User Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Carga de Trabajo por Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.user_workloads && metrics.user_workloads.length > 0 ? (
                metrics.user_workloads.slice(0, 5).map((user) => (
                  <div key={user.user_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{user.user_name}</span>
                      <span className="text-muted-foreground">
                        {user.active_processes} procesos
                      </span>
                    </div>
                    <ProgressBar
                      value={user.active_processes}
                      max={10}
                      showLabel={false}
                      color={
                        user.active_processes > 7
                          ? "red"
                          : user.active_processes > 4
                          ? "orange"
                          : "green"
                      }
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios con procesos activos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      {metrics.users && metrics.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Área</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Activo
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
