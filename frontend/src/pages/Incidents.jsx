import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, ArrowLeft, AlertTriangle } from "lucide-react";
import {
  getProjectIncidents,
  createIncident,
  deleteIncident,
} from "@/api/incidents";
import { projectsAPI } from "@/api/projects";
import IncidentsList from "@/components/incidents/IncidentsList";
import IncidentForm from "@/components/incidents/IncidentForm";

export default function Incidents() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectData, incidentsData] = await Promise.all([
        projectsAPI.getById(projectId),
        getProjectIncidents(projectId),
      ]);
      setProject(projectData);
      setIncidents(incidentsData.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar incidentes");
      console.error("Error loading incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (data) => {
    try {
      await createIncident({ ...data, project_id: parseInt(projectId) });
      await loadData();
      setShowForm(false);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Error al crear incidente"
      );
    }
  };

  const handleEditIncident = (incident) => {
    setEditingIncident(incident);
    setShowForm(true);
  };

  const handleDeleteIncident = async (incidentId) => {
    if (!confirm("¿Estás seguro de eliminar este incidente?")) return;

    try {
      await deleteIncident(incidentId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar incidente");
    }
  };

  const criticalIncidents = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "closed"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando incidentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Error</p>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={loadData} className="mt-4 w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Incidentes</h1>
          {project && (
            <p className="text-muted-foreground">
              Proyecto: <span className="font-semibold">{project.name}</span>
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingIncident(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Reportar Incidente
        </Button>
      </div>

      {/* Critical Incidents Alert */}
      {criticalIncidents.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-semibold">
                {criticalIncidents.length} incidente(s) crítico(s) requiere(n)
                atención inmediata
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.status === "open").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.status === "resolved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {criticalIncidents.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List or Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingIncident
                ? "Editar Incidente"
                : "Reportar Nuevo Incidente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentForm
              incident={editingIncident}
              projectId={projectId}
              onSubmit={handleCreateIncident}
              onCancel={() => {
                setShowForm(false);
                setEditingIncident(null);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <IncidentsList
          incidents={incidents}
          onEdit={handleEditIncident}
          onDelete={handleDeleteIncident}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
