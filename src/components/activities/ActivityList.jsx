import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2, FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  documentacion: "Documentación"
};

export default function ActivityList({ activities, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No se encontraron actividades</p>
        <p className="text-sm text-muted-foreground mt-2">
          Ajusta los filtros o registra nuevas actividades
        </p>
      </div>
    );
  }

  const grouped = activities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayActivities]) => {
        const totalHours = dayActivities.reduce((sum, act) => sum + (act.execution_time || 0), 0);
        
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {format(new Date(date), "EEEE, d 'de' MMMM", { locale: es })}
              </h3>
              <Badge variant="outline">{totalHours.toFixed(2)}h</Badge>
            </div>
            
            <div className="space-y-3">
              {dayActivities.map(activity => (
                <div
                  key={activity.id}
                  className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium text-foreground">
                          {activity.activity_name}
                        </h4>
                        {activity.project_name && (
                          <Badge variant="outline" className="gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {activity.project_name}
                          </Badge>
                        )}
                        {activity.is_meeting && (
                          <Badge variant="secondary">Reunión</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Badge variant="secondary">
                          {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.execution_time}h
                        </span>
                        {activity.other_area && (
                          <span>→ {activity.other_area}</span>
                        )}
                      </div>
                      
                      {activity.observations && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {activity.observations}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(activity)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(activity.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}