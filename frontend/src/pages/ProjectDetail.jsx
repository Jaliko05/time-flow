import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { projectsAPI, tasksAPI, usersAPI } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FolderKanban,
  TrendingUp,
  Users,
  MessageSquare,
  ListTodo,
} from "lucide-react";
import TaskBoard from "../components/tasks/TaskBoard";
import TaskFormDialog from "../components/tasks/TaskFormDialog";
import CommentSection from "../components/tasks/CommentSection";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/common/UserAvatar";

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
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState("backlog");

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

  const { data: areaUsers = [] } = useQuery({
    queryKey: ["users", { area_id: project?.area_id }],
    queryFn: () => usersAPI.getAll({ area_id: project?.area_id }),
    enabled:
      !!project?.area_id &&
      (user?.role === "admin" || user?.role === "superadmin"),
  });

  const handleCreateTask = (status = "backlog") => {
    setSelectedTask(null);
    setInitialStatus(status);
    setShowTaskDialog(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
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
                Resumen de Tareas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de tareas:</span>
                <span className="font-bold">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backlog:</span>
                <span className="font-medium">
                  {tasks.filter((t) => t.status === "backlog").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">En progreso:</span>
                <span className="font-medium">
                  {tasks.filter((t) => t.status === "in_progress").length}
                </span>
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

        {/* Tasks Kanban and Comments */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tareas ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5" />
                  Tablero de Tareas (Planner)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskBoard
                  tasks={tasks}
                  onEditTask={handleEditTask}
                  onCreateTask={handleCreateTask}
                  users={areaUsers}
                  isLoading={tasksLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <CommentSection projectId={parseInt(id)} />
          </TabsContent>
        </Tabs>

        {/* Task Dialog */}
        <TaskFormDialog
          open={showTaskDialog}
          onOpenChange={(open) => {
            setShowTaskDialog(open);
            if (!open) setSelectedTask(null);
          }}
          task={selectedTask}
          projectId={parseInt(id)}
          users={areaUsers}
        />
      </div>
    </div>
  );
}
