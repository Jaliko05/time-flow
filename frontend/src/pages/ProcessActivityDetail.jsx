import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProcessActivity, updateProcessActivity } from "@/api/processes";
import { getComments, createComment, deleteComment } from "@/api/comments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ListTodo,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ACTIVITY_STATUSES = {
  backlog: {
    label: "Backlog",
    color: "bg-gray-100 border-gray-300 text-gray-700",
    icon: ListTodo,
  },
  pending: {
    label: "Pendiente",
    color: "bg-gray-100 border-gray-300 text-gray-700",
    icon: ListTodo,
  },
  assigned: {
    label: "Asignado",
    color: "bg-orange-100 border-orange-400 text-orange-700",
    icon: PlayCircle,
  },
  in_progress: {
    label: "En Progreso",
    color: "bg-blue-100 border-blue-400 text-blue-700",
    icon: PlayCircle,
  },
  paused: {
    label: "Detenido",
    color: "bg-red-100 border-red-400 text-red-700",
    icon: PauseCircle,
  },
  blocked: {
    label: "Bloqueado",
    color: "bg-red-100 border-red-400 text-red-700",
    icon: AlertCircle,
  },
  completed: {
    label: "Finalizado",
    color: "bg-green-100 border-green-400 text-green-700",
    icon: CheckCircle2,
  },
};

function CommentItem({ comment, currentUser, onDelete }) {
  const canDelete =
    currentUser?.role === "admin" ||
    currentUser?.role === "superadmin" ||
    comment.user_id === currentUser?.id;

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user?.avatar} />
        <AvatarFallback>
          {comment.user?.full_name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.user?.full_name || "Usuario"}
            </span>
            <Badge variant="outline" className="text-xs">
              {comment.user?.role || "user"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {comment.created_at &&
                format(new Date(comment.created_at), "d MMM yyyy, HH:mm", {
                  locale: es,
                })}
            </span>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
}

function DocumentItem({ doc }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{doc.name}</p>
        <p className="text-xs text-muted-foreground">
          {doc.size || "Documento"}
        </p>
      </div>
      <Paperclip className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

export default function ProcessActivityDetail() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  const canEdit = user?.role === "admin" || user?.role === "superadmin";

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["process-activity", activityId],
    queryFn: () => getProcessActivity(activityId),
    enabled: !!activityId,
  });
  const activity = activityData?.data;

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ["activity-comments", activityId],
    queryFn: () =>
      getComments({
        entity_type: "process_activity",
        entity_id: parseInt(activityId),
      }),
    enabled: !!activityId,
  });
  const comments = commentsData?.data || [];

  const updateActivityMutation = useMutation({
    mutationFn: (data) => updateProcessActivity(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["process-activity", activityId]);
      toast({ title: "Actividad actualizada" });
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  const handleStatusChange = (newStatus) => {
    updateActivityMutation.mutate({ status: newStatus });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment({
        entity_type: "process_activity",
        entity_id: parseInt(activityId),
        content: newComment,
      });
      setNewComment("");
      refetchComments();
      toast({ title: "Comentario agregado" });
    } catch (err) {
      toast({ title: "Error al agregar comentario", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      refetchComments();
      toast({ title: "Comentario eliminado" });
    } catch (err) {
      toast({ title: "Error al eliminar comentario", variant: "destructive" });
    }
  };

  if (activityLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Actividad no encontrada</h2>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const status =
    ACTIVITY_STATUSES[activity.status] || ACTIVITY_STATUSES.backlog;
  const StatusIcon = status.icon;
  const documents = activity.documents || [];

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{activity.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("flex items-center gap-1", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              {activity.process?.name && (
                <Badge variant="outline">{activity.process.name}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors",
              activeTab === "info"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Información
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors",
              activeTab === "comments"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Comentarios ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors",
              activeTab === "docs"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Paperclip className="h-4 w-4 inline mr-2" />
            Documentación ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("repos")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors",
              activeTab === "repos"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GitBranch className="h-4 w-4 inline mr-2" />
            Repositorios
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {activity.description || "Sin descripción"}
                  </p>
                </CardContent>
              </Card>

              {activity.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {activity.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* Estado */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Estado
                    </label>
                    {canEdit ? (
                      <Select
                        value={activity.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="assigned">Asignado</SelectItem>
                          <SelectItem value="in_progress">
                            En Progreso
                          </SelectItem>
                          <SelectItem value="paused">Detenido</SelectItem>
                          <SelectItem value="completed">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={cn(status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Asignado a */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      <Users className="h-4 w-4 inline mr-1" />
                      Asignado a
                    </label>
                    {activity.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {activity.assigned_user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {activity.assigned_user.full_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sin asignar
                      </span>
                    )}
                  </div>

                  <Separator />

                  {/* Horas Estimadas */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Horas Estimadas
                    </label>
                    <span className="text-sm">
                      {activity.estimated_hours
                        ? `${activity.estimated_hours}h`
                        : "Sin estimar"}
                    </span>
                  </div>

                  {/* Horas Reales */}
                  {activity.actual_hours && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Horas Reales
                        </label>
                        <span className="text-sm">
                          {activity.actual_hours}h
                        </span>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Fechas */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Fecha Límite
                    </label>
                    <span className="text-sm">
                      {activity.due_date
                        ? format(new Date(activity.due_date), "d MMM yyyy", {
                            locale: es,
                          })
                        : "Sin fecha"}
                    </span>
                  </div>

                  <Separator />

                  {/* Creación */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Creado
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {activity.created_at &&
                        format(
                          new Date(activity.created_at),
                          "d MMM yyyy, HH:mm",
                          { locale: es }
                        )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-4">
            {/* Add Comment */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <Card>
              <CardHeader>
                <CardTitle>Comentarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUser={user}
                      onDelete={handleDeleteComment}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No hay comentarios aún</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "docs" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documentación</span>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Adjuntar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc, idx) => (
                    <DocumentItem key={doc.id || idx} doc={doc} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay documentos adjuntos</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "repos" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Repositorios</span>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Vincular Repositorio
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.repositories && activity.repositories.length > 0 ? (
                <div className="space-y-3">
                  {activity.repositories.map((repo, idx) => (
                    <a
                      key={repo.id || idx}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
                        <GitBranch className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {repo.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {repo.url}
                        </p>
                        {repo.branch && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {repo.branch}
                          </Badge>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="mb-2">No hay repositorios vinculados</p>
                  <p className="text-sm">
                    Vincula repositorios de GitHub, GitLab o Bitbucket para
                    rastrear el código relacionado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
