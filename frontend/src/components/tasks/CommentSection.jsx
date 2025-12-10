import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { commentsAPI } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Edit2, Trash2, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function CommentItem({ comment, onEdit, onDelete, currentUserId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = comment.user_id === currentUserId;
  const initials =
    comment.user_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Avatar */}
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className="bg-blue-500 text-white text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.user_name}</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>

          {/* Acciones (solo para el dueño) */}
          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-red-600 hover:text-red-700"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Contenido del comentario */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-sm min-h-[60px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveEdit}
                className="h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ projectId = null, taskId = null }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Validación
  if (!projectId && !taskId) {
    return (
      <div className="text-center py-4 text-red-500">
        Error: Debe especificar projectId o taskId
      </div>
    );
  }

  // Query para obtener comentarios
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", { projectId, taskId }],
    queryFn: () => {
      if (projectId) return commentsAPI.getByProject(projectId);
      if (taskId) return commentsAPI.getByTask(taskId);
    },
    enabled: !!(projectId || taskId),
  });

  // Mutación para crear comentario
  const createMutation = useMutation({
    mutationFn: (content) =>
      commentsAPI.create({
        content,
        ...(projectId && { project_id: projectId }),
        ...(taskId && { task_id: taskId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["comments"]);
      setNewComment("");
      toast({
        title: "Comentario agregado",
        description: "Tu comentario se publicó correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al crear comentario",
        variant: "destructive",
      });
    },
  });

  // Mutación para editar comentario
  const updateMutation = useMutation({
    mutationFn: ({ id, content }) => commentsAPI.update(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(["comments"]);
      toast({
        title: "Comentario actualizado",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar comentario",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar comentario
  const deleteMutation = useMutation({
    mutationFn: (id) => commentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["comments"]);
      toast({
        title: "Comentario eliminado",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al eliminar comentario",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createMutation.mutate(newComment);
    }
  };

  const handleEdit = (id, content) => {
    updateMutation.mutate({ id, content });
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este comentario?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Comentarios
          <span className="text-sm font-normal text-gray-500">
            ({comments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario para nuevo comentario */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="min-h-[80px]"
            disabled={createMutation.isLoading}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || createMutation.isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              {createMutation.isLoading ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </form>

        {/* Lista de comentarios */}
        <div className="border-t pt-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando comentarios...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No hay comentarios aún</p>
              <p className="text-sm">Sé el primero en comentar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
