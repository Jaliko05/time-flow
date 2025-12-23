import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  canStartActivity,
  getBlockedActivities,
} from "@/utils/dependencyValidator";

export default function ActivityStatusFlow({ activity, allActivities = [] }) {
  const canStart = canStartActivity(activity, allActivities);
  const blockedActivities = getBlockedActivities(activity.id, allActivities);

  const dependencies = activity.dependencies || [];
  const dependencyActivities = allActivities.filter((a) =>
    dependencies.includes(a.id)
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completada":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "En Progreso":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Pendiente":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completada":
        return "bg-green-100 text-green-800";
      case "En Progreso":
        return "bg-blue-100 text-blue-800";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Flujo de Estado y Dependencias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Activity Status */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Actividad Actual</h4>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={getStatusColor(activity.status)}
            >
              {getStatusIcon(activity.status)}
              {activity.status}
            </Badge>
            <span className="text-sm">{activity.name}</span>
          </div>
        </div>

        {/* Can Start Validation */}
        {activity.status === "Pendiente" && (
          <Alert variant={canStart ? "default" : "destructive"}>
            {canStart ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {canStart
                ? "Esta actividad puede iniciarse. Todas las dependencias están completadas."
                : "Esta actividad NO puede iniciarse. Hay dependencias pendientes."}
            </AlertDescription>
          </Alert>
        )}

        {/* Dependencies */}
        {dependencyActivities.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">
              Depende de ({dependencyActivities.length})
            </h4>
            <div className="space-y-2">
              {dependencyActivities.map((dep) => (
                <div key={dep.id} className="flex items-center gap-2 text-sm">
                  {getStatusIcon(dep.status)}
                  <span className="flex-1">{dep.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(dep.status)}`}
                  >
                    {dep.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Activities */}
        {blockedActivities.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">
              Bloquea a ({blockedActivities.length})
            </h4>
            <div className="space-y-2">
              {blockedActivities.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="flex-1">{blocked.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(blocked.status)}`}
                  >
                    {blocked.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Dependencies */}
        {dependencyActivities.length === 0 &&
          blockedActivities.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Esta actividad no tiene dependencias ni bloquea otras actividades
            </p>
          )}
      </CardContent>
    </Card>
  );
}
