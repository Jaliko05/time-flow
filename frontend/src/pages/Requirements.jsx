import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, ArrowLeft } from "lucide-react";
import {
  getProjectRequirements,
  createRequirement,
  deleteRequirement,
} from "@/api/requirements";
import { projectsAPI } from "@/api/projects";
import RequirementsList from "@/components/requirements/RequirementsList";
import RequirementForm from "@/components/requirements/RequirementForm";

export default function Requirements() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectData, requirementsData] = await Promise.all([
        projectsAPI.getById(projectId),
        getProjectRequirements(projectId),
      ]);
      setProject(projectData);
      setRequirements(requirementsData.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar requerimientos");
      console.error("Error loading requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequirement = async (data) => {
    try {
      await createRequirement({ ...data, project_id: parseInt(projectId) });
      await loadData();
      setShowForm(false);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Error al crear requerimiento"
      );
    }
  };

  const handleEditRequirement = (requirement) => {
    setEditingRequirement(requirement);
    setShowForm(true);
  };

  const handleDeleteRequirement = async (requirementId) => {
    if (!confirm("¿Estás seguro de eliminar este requerimiento?")) return;

    try {
      await deleteRequirement(requirementId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar requerimiento");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Cargando requerimientos...
          </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Requerimientos</h1>
          {project && (
            <p className="text-muted-foreground">
              Proyecto: <span className="font-semibold">{project.name}</span>
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingRequirement(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Requerimiento
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requirements.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requirements.filter((r) => r.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requirements.filter((r) => r.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements List or Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRequirement
                ? "Editar Requerimiento"
                : "Nuevo Requerimiento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RequirementForm
              requirement={editingRequirement}
              projectId={projectId}
              onSubmit={handleCreateRequirement}
              onCancel={() => {
                setShowForm(false);
                setEditingRequirement(null);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <RequirementsList
          requirements={requirements}
          onEdit={handleEditRequirement}
          onDelete={handleDeleteRequirement}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
