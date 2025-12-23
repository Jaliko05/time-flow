import { useEffect, useState } from "react";
import { Users, FolderKanban, Building2, Clock } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import BarChart from "@/components/charts/BarChart";
import PieChart from "@/components/charts/PieChart";
import LineChart from "@/components/charts/LineChart";
import { getSuperAdminDashboard } from "@/api/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getSuperAdminDashboard();
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
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
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

  const projectsByAreaData = (metrics.projects_by_area || []).map((area) => ({
    area: area.area_name,
    total: area.total,
    activos: area.active,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Dashboard SuperAdmin
        </h2>
        <p className="text-muted-foreground">
          Vista global de todas las áreas y proyectos
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Proyectos"
          value={metrics.total_projects || 0}
          icon={FolderKanban}
          color="blue"
          description={`${metrics.active_projects || 0} activos`}
        />
        <MetricCard
          title="Total Usuarios"
          value={metrics.total_users || 0}
          icon={Users}
          color="green"
          description="En todas las áreas"
        />
        <MetricCard
          title="Total Áreas"
          value={metrics.total_areas || 0}
          icon={Building2}
          color="purple"
          description="Departamentos activos"
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

        {projectsByAreaData.length > 0 && (
          <BarChart
            data={projectsByAreaData}
            title="Proyectos por Área"
            xKey="area"
            yKey="total"
            barColor="#3b82f6"
          />
        )}
      </div>

      {/* Recent Projects */}
      {metrics.recent_projects && metrics.recent_projects.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Proyectos Recientes</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.recent_projects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium">{project.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
