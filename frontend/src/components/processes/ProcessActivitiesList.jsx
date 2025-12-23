import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";

export default function ProcessActivitiesList({
  activities = [],
  loading = false,
  onEdit,
  onDelete,
  onCreate,
  canEdit = true,
}) {
  const getStatusIcon = (status) => {
    const icons = {
      Pendiente: <Clock className="h-4 w-4 text-yellow-600" />,
      "En Progreso": <AlertCircle className="h-4 w-4 text-blue-600" />,
      Completada: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    };
    return icons[status] || <Clock className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      Pendiente: "bg-yellow-100 text-yellow-800",
      "En Progreso": "bg-blue-100 text-blue-800",
      Completada: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Actividades del Proceso</CardTitle>
          {canEdit && (
            <Button onClick={onCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay actividades en este proceso. Crea una nueva actividad para
              comenzar.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Order Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {activity.order || index + 1}
                    </div>

                    {/* Activity Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1">{activity.name}</h4>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {activity.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={`gap-1 ${getStatusColor(activity.status)}`}
                        >
                          {getStatusIcon(activity.status)}
                          {activity.status}
                        </Badge>

                        {/* Assigned User */}
                        {activity.assignedUserName && (
                          <Badge variant="secondary">
                            {activity.assignedUserName}
                          </Badge>
                        )}

                        {/* Estimated Hours */}
                        {activity.estimatedHours && (
                          <span className="text-xs text-gray-500">
                            {activity.estimatedHours}h estimadas
                          </span>
                        )}

                        {/* Dependencies */}
                        {activity.dependencies &&
                          activity.dependencies.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {activity.dependencies.length} dependencia(s)
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(activity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(activity.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
