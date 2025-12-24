import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getRequirement } from "@/api/requirements";
import { getProcesses, createProcess } from "@/api/processes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  FolderOpen,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ProcessForm from "@/components/processes/ProcessForm";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "bg-gray-100 text-gray-700",
    icon: AlertCircle,
  },
  in_progress: {
    label: "En Progreso",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  completed: {
    label: "Completado",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "bg-gray-50 text-gray-600" },
  medium: { label: "Media", color: "bg-blue-50 text-blue-600" },
  high: { label: "Alta", color: "bg-orange-50 text-orange-600" },
  critical: { label: "Crítica", color: "bg-red-50 text-red-600" },
};

function ProcessCard({ process, onClick }) {
  const completedActivities =
    process.activities?.filter((a) => a.status === "completed").length || 0;
  const totalActivities = process.activities?.length || 0;
  const progress =
    totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <Card
      onClick={() => onClick(process)}
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs">
              Proceso #{process.id}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-2">{process.name}</h3>

        {process.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {process.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completedActivities}/{totalActivities} actividades
          </span>
          {process.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {process.estimated_hours}h
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RequirementDetail() {
  const { requirementId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showProcessForm, setShowProcessForm] = useState(false);

  const canEdit = user?.role === "admin" || user?.role === "superadmin";

  const { data: requirementData, isLoading: requirementLoading } = useQuery({
    queryKey: ["requirement", requirementId],
    queryFn: () => getRequirement(requirementId),
    enabled: !!requirementId,
  });
  const requirement = requirementData?.data;

  const {
    data: processesData,
    isLoading: processesLoading,
    refetch: refetchProcesses,
  } = useQuery({
    queryKey: ["requirement-processes", requirementId],
    queryFn: () => getProcesses({ requirement_id: requirementId }),
    enabled: !!requirementId,
  });
  const processes = processesData?.data || [];

  const handleProcessClick = (process) => {
    navigate(`/process/${process.id}`);
  };

  const handleCreateProcess = async (data) => {
    try {
      await createProcess({ ...data, requirement_id: parseInt(requirementId) });
      refetchProcesses();
      setShowProcessForm(false);
      toast({ title: "Proceso creado exitosamente" });
    } catch (err) {
      toast({ title: "Error al crear proceso", variant: "destructive" });
    }
  };

  if (requirementLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Requerimiento no encontrado</h2>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[requirement.status] || STATUS_CONFIG.pending;
  const priorityConfig = requirement.priority
    ? PRIORITY_CONFIG[requirement.priority]
    : null;
  const StatusIcon = statusConfig.icon;

  // Calcular métricas
  const totalActivities = processes.reduce(
    (acc, p) => acc + (p.activities?.length || 0),
    0
  );
  const completedActivities = processes.reduce(
    (acc, p) =>
      acc + (p.activities?.filter((a) => a.status === "completed").length || 0),
    0
  );
  const overallProgress =
    totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                REQ-{requirement.id}
              </Badge>
              <Badge className={cn(statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {priorityConfig && (
                <Badge className={cn(priorityConfig.color)}>
                  {priorityConfig.label}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{requirement.name}</h1>
            {requirement.description && (
              <p className="text-muted-foreground mt-1">
                {requirement.description}
              </p>
            )}
          </div>
          {canEdit && (
            <Button onClick={() => setShowProcessForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proceso
            </Button>
          )}
        </div>

        {/* Métricas del Requerimiento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Procesos</span>
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{processes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Actividades
                </span>
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{totalActivities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Completadas
                </span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{completedActivities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progreso</span>
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {overallProgress.toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de progreso general */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progreso General del Requerimiento
              </span>
              <span className="text-sm text-muted-foreground">
                {overallProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Lista de Procesos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Procesos del Requerimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : processes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processes.map((process) => (
                  <ProcessCard
                    key={process.id}
                    process={process}
                    onClick={handleProcessClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground mb-4">
                  No hay procesos definidos para este requerimiento.
                </p>
                {canEdit && (
                  <Button onClick={() => setShowProcessForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Proceso
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Form Dialog */}
        {showProcessForm && (
          <ProcessForm
            open={showProcessForm}
            onOpenChange={setShowProcessForm}
            onSubmit={handleCreateProcess}
          />
        )}
      </div>
    </div>
  );
}
