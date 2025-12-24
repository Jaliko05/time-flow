import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  projectsAPI,
  tasksAPI,
  usersAPI,
  getProjectRequirements,
  getProjectIncidents,
} from "@/api";
import { getProcesses } from "@/api/processes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  AlertTriangle,
  Plus,
  Activity,
} from "lucide-react";
import CommentSection from "../components/tasks/CommentSection";
import RequirementForm from "../components/requirements/RequirementForm";
import IncidentForm from "../components/incidents/IncidentForm";
import ActivityForm from "../components/activities/ActivityForm";
import { ProcessCardsGrid } from "@/components/common/ProcessCard";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  createRequirement,
  deleteRequirement,
  updateRequirement,
} from "@/api/requirements";
import {
  createIncident,
  deleteIncident,
  updateIncident,
} from "@/api/incidents";

const STATUS_CONFIG = {
  unassigned: { label: "Sin asignar", color: "bg-gray-100 text-gray-800" },
  assigned: { label: "Asignado", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "En progreso", color: "bg-yellow-100 text-yellow-800" },
  paused: { label: "Pausado", color: "bg-orange-100 text-orange-800" },
  completed: { label: "Completado", color: "bg-green-100 text-green-800" },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para Activities
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Estados para Requirements
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  // Estados para Incidents
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsAPI.getById(id),
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { project_id: id }],
    queryFn: () => tasksAPI.getAll({ project_id: id }),
    enabled: !!id,
  });

  // Query para Requirements
  const {
    data: requirementsData,
    isLoading: requirementsLoading,
    refetch: refetchRequirements,
  } = useQuery({
    queryKey: ["requirements", id],
    queryFn: () => getProjectRequirements(id),
    enabled: !!id,
  });
  const requirements = requirementsData?.data || [];

  // Query para Incidents
  const {
    data: incidentsData,
    isLoading: incidentsLoading,
    refetch: refetchIncidents,
  } = useQuery({
    queryKey: ["incidents", id],
    queryFn: () => getProjectIncidents(id),
    enabled: !!id,
  });
  const incidents = incidentsData?.data || [];

  const { data: areaUsers = [] } = useQuery({
    queryKey: ["users", { area_id: project?.area_id }],
    queryFn: () => usersAPI.getAll({ area_id: project?.area_id }),
    enabled:
      !!project?.area_id &&
      (user?.role === "admin" || user?.role === "superadmin"),
  });

  // Handlers para Requirements
  const handleCreateRequirement = async (data) => {
    try {
      await createRequirement({ ...data, project_id: parseInt(id) });
      refetchRequirements();
      setShowRequirementForm(false);
      toast({ title: "Requerimiento creado exitosamente" });
    } catch (err) {
      toast({ title: "Error al crear requerimiento", variant: "destructive" });
    }
  };

  const handleRequirementClick = (requirement) => {
    // Navegar al detalle del requerimiento (muestra sus procesos)
    navigate(`/requirement/${requirement.id}`);
  };

  const handleEditRequirement = (requirement) => {
    setEditingRequirement(requirement);
    setShowRequirementForm(true);
  };

  const handleDeleteRequirement = async (requirementId) => {
    if (!confirm("¿Estás seguro de eliminar este requerimiento?")) return;
    try {
      await deleteRequirement(requirementId);
      refetchRequirements();
      toast({ title: "Requerimiento eliminado" });
    } catch (err) {
      toast({
        title: "Error al eliminar requerimiento",
        variant: "destructive",
      });
    }
  };

  // Handlers para Incidents
  const handleCreateIncident = async (data) => {
    try {
      await createIncident({ ...data, project_id: parseInt(id) });
      refetchIncidents();
      setShowIncidentForm(false);
      toast({ title: "Incidente creado exitosamente" });
    } catch (err) {
      toast({ title: "Error al crear incidente", variant: "destructive" });
    }
  };

  const handleIncidentClick = (incident) => {
    // Navegar al detalle del incidente (muestra sus procesos)
    navigate(`/incident/${incident.id}`);
  };

  const handleEditIncident = (incident) => {
    setEditingIncident(incident);
    setShowIncidentForm(true);
  };

  const handleDeleteIncident = async (incidentId) => {
    if (!confirm("¿Estás seguro de eliminar este incidente?")) return;
    try {
      await deleteIncident(incidentId);
      refetchIncidents();
      toast({ title: "Incidente eliminado" });
    } catch (err) {
      toast({ title: "Error al eliminar incidente", variant: "destructive" });
    }
  };

  // Handlers para Activities
  const handleCreateActivity = async (data) => {
    try {
      await tasksAPI.create({ ...data, project_id: parseInt(id) });
      queryClient.invalidateQueries(["tasks", { project_id: id }]);
      setShowActivityForm(false);
      toast({ title: "Actividad creada exitosamente" });
    } catch (err) {
      toast({ title: "Error al crear actividad", variant: "destructive" });
    }
  };

  const handleActivityClick = (activity) => {
    // Navegar al detalle de la tarea (muestra sus actividades directamente)
    navigate(`/task/${activity.id}`);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowActivityForm(true);
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Proyecto no encontrado</h2>
        <Button onClick={() => navigate("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Proyectos
        </Button>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[project.status] || STATUS_CONFIG.unassigned;
  const canEdit = user?.role === "admin" || user?.role === "superadmin";
  const progressPercentage = project.completion_percent || 0;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Estimadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">
                  {project.estimated_hours}h
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Utilizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">
                  {project.used_hours}h
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Restantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold">
                  {project.remaining_hours}h
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Información del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline">
                  {project.project_type === "personal" ? "Personal" : "Área"}
                </Badge>
              </div>
              {project.area && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Área:</span>
                  <span className="font-medium">{project.area.name}</span>
                </div>
              )}

              {/* Show team members */}
              {(project.assigned_users?.length > 0 ||
                project.assigned_user) && (
                <div>
                  <span className="text-muted-foreground block mb-2">
                    Equipo ({project.assigned_users?.length || 1}):
                  </span>
                  <div className="space-y-2">
                    {(
                      project.assigned_users ||
                      (project.assigned_user ? [project.assigned_user] : [])
                    ).map((member) => (
                      <UserAvatar
                        key={member.id}
                        user={member}
                        size="sm"
                        showName={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado por:</span>
                <span className="font-medium">
                  {project.creator?.full_name || "Desconocido"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Fecha de creación:
                </span>
                <span className="font-medium">
                  {new Date(project.created_at).toLocaleDateString("es-ES")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Resumen del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requerimientos:</span>
                <span className="font-bold">{requirements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Incidentes:</span>
                <span className="font-bold">{incidents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actividades:</span>
                <span className="font-bold">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completadas:</span>
                <span className="font-medium text-green-600">
                  {tasks.filter((t) => t.status === "completed").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* REQ / INC / ACT Cards Grid */}
        <Tabs defaultValue="requirements" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="requirements"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              REQ ({requirements.length})
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              INC ({incidents.length})
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ACT ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Requerimientos del Proyecto
                </CardTitle>
                {canEdit && (
                  <Button
                    onClick={() => {
                      setEditingRequirement(null);
                      setShowRequirementForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Requerimiento
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ProcessCardsGrid
                  items={requirements}
                  type="requirement"
                  onItemClick={handleRequirementClick}
                  emptyMessage="No hay requerimientos. Crea el primero para comenzar."
                  loading={requirementsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Incidentes del Proyecto
                </CardTitle>
                {canEdit && (
                  <Button
                    onClick={() => {
                      setEditingIncident(null);
                      setShowIncidentForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Reportar Incidente
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ProcessCardsGrid
                  items={incidents}
                  type="incident"
                  onItemClick={handleIncidentClick}
                  emptyMessage="No hay incidentes reportados."
                  loading={incidentsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Actividades del Proyecto
                </CardTitle>
                {canEdit && (
                  <Button
                    onClick={() => {
                      setEditingActivity(null);
                      setShowActivityForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Actividad
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ProcessCardsGrid
                  items={tasks}
                  type="activity"
                  onItemClick={handleActivityClick}
                  emptyMessage="No hay actividades. Crea la primera para comenzar."
                  loading={tasksLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <CommentSection projectId={parseInt(id)} />
          </TabsContent>
        </Tabs>

        {/* Activity Form Dialog */}
        {showActivityForm && (
          <ActivityForm
            open={showActivityForm}
            onOpenChange={(open) => {
              setShowActivityForm(open);
              if (!open) setEditingActivity(null);
            }}
            activity={editingActivity}
            projectId={parseInt(id)}
            onSubmit={handleCreateActivity}
          />
        )}

        {/* Requirement Form Dialog */}
        {showRequirementForm && (
          <RequirementForm
            open={showRequirementForm}
            onOpenChange={(open) => {
              setShowRequirementForm(open);
              if (!open) setEditingRequirement(null);
            }}
            requirement={editingRequirement}
            projectId={parseInt(id)}
            onSubmit={handleCreateRequirement}
          />
        )}

        {/* Incident Form Dialog */}
        {showIncidentForm && (
          <IncidentForm
            open={showIncidentForm}
            onOpenChange={(open) => {
              setShowIncidentForm(open);
              if (!open) setEditingIncident(null);
            }}
            incident={editingIncident}
            projectId={parseInt(id)}
            onSubmit={handleCreateIncident}
          />
        )}
      </div>
    </div>
  );
}
