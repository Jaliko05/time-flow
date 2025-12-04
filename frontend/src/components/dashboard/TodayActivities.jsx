import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { activitiesAPI } from "@/api";
import { useToast } from "@/components/ui/use-toast";

const ACTIVITY_TYPE_LABELS = {
  plan_de_trabajo: "Plan de Trabajo",
  apoyo_solicitado_por_otras_areas: "Apoyo a Otras Áreas",
  teams: "Teams",
  interno: "Interno",
  sesion: "Sesión",
  investigacion: "Investigación",
  prototipado: "Prototipado",
  disenos: "Diseños",
  pruebas: "Pruebas",
  documentacion: "Documentación",
};

export default function TodayActivities({ userId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  // Obtener actividades de hoy del usuario
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", userId, today],
    queryFn: () => activitiesAPI.getAll({ date: today }),
    enabled: !!userId,
  });

  // Mutación para eliminar actividad
  const deleteActivityMutation = useMutation({
    mutationFn: (id) => activitiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["activities"]);
      toast({
        title: "Éxito",
        description: "Actividad eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al eliminar actividad",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No has registrado actividades hoy</p>
        <p className="text-sm mt-1">
          Utiliza el formulario arriba para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-foreground truncate">
                  {activity.activity_name}
                </h4>
                {activity.project_name && (
                  <Badge variant="outline" className="gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {activity.project_name}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.execution_time}h
                </span>
              </div>

              {activity.observations && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {activity.observations}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteActivityMutation.mutate(activity.id)}
              disabled={deleteActivityMutation.isLoading}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
