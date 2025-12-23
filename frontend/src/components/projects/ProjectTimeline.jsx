import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProjectTimeline({ activities = [], onActivityClick }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No hay actividades para mostrar en la línea de tiempo
        </CardContent>
      </Card>
    );
  }

  // Sort activities by start date or order
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.startDate && b.startDate) {
      return new Date(a.startDate) - new Date(b.startDate);
    }
    return (a.order || 0) - (b.order || 0);
  });

  // Calculate timeline dimensions
  const today = new Date();
  const dates = activities
    .filter((a) => a.startDate)
    .map((a) => new Date(a.startDate));

  const minDate =
    dates.length > 0
      ? new Date(Math.min(...dates))
      : new Date(today.getFullYear(), today.getMonth(), 1);

  const maxDate =
    dates.length > 0
      ? new Date(Math.max(...dates))
      : new Date(today.getFullYear(), today.getMonth() + 3, 0);

  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) || 1;

  const getPosition = (date) => {
    if (!date) return 0;
    const activityDate = new Date(date);
    const days = Math.ceil((activityDate - minDate) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completada":
        return "bg-green-500";
      case "En Progreso":
        return "bg-blue-500";
      case "Pendiente":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Generate month markers
  const monthMarkers = [];
  const current = new Date(minDate);
  current.setDate(1);

  while (current <= maxDate) {
    monthMarkers.push({
      date: new Date(current),
      position: getPosition(current),
      label: current.toLocaleDateString("es-ES", {
        month: "short",
        year: "numeric",
      }),
    });
    current.setMonth(current.getMonth() + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Línea de Tiempo</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline Header */}
        <div className="relative h-8 mb-4 border-b">
          {monthMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-0 text-xs text-gray-600"
              style={{ left: `${marker.position}%` }}
            >
              {marker.label}
            </div>
          ))}
        </div>

        {/* Timeline Items */}
        <div className="space-y-3">
          {sortedActivities.map((activity, idx) => {
            const startPos = activity.startDate
              ? getPosition(activity.startDate)
              : 0;
            const endPos = activity.endDate
              ? getPosition(activity.endDate)
              : startPos + 5; // Default width if no end date

            return (
              <div key={activity.id} className="relative">
                {/* Activity Row */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium w-8 text-gray-500">
                    {activity.order || idx + 1}
                  </span>
                  <span className="text-sm truncate flex-1">
                    {activity.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getStatusColor(activity.status))}
                  >
                    {activity.status}
                  </Badge>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-8 ml-10">
                  {/* Background Track */}
                  <div className="absolute inset-0 bg-gray-100 rounded" />

                  {/* Activity Bar */}
                  <div
                    className={cn(
                      "absolute h-full rounded cursor-pointer transition-all hover:opacity-80",
                      getStatusColor(activity.status)
                    )}
                    style={{
                      left: `${startPos}%`,
                      width: `${Math.max(endPos - startPos, 2)}%`,
                    }}
                    onClick={() => onActivityClick(activity)}
                  >
                    {activity.estimatedHours && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                        {activity.estimatedHours}h
                      </span>
                    )}
                  </div>

                  {/* Today Marker */}
                  {getPosition(today) >= 0 && getPosition(today) <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                      style={{ left: `${getPosition(today)}%` }}
                      title="Hoy"
                    />
                  )}
                </div>

                {/* Dependencies Indicator */}
                {activity.dependencies && activity.dependencies.length > 0 && (
                  <div className="ml-10 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.dependencies.length} dependencia(s)
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>En Progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500" />
            <span>Hoy</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
