import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HeatmapCalendar({
  data = [], // Array of {date: 'YYYY-MM-DD', value: number}
  title = "Actividad",
  maxValue = 10,
  className = "",
}) {
  // Generate calendar grid for the last 12 weeks
  const weeks = 12;
  const days = weeks * 7;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  // Create a map for quick lookups
  const dataMap = data.reduce((acc, item) => {
    acc[item.date] = item.value;
    return {};
  }, {});

  // Generate all dates
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dates.push({
      date: dateStr,
      value: dataMap[dateStr] || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Group by weeks
  const weeksData = [];
  for (let i = 0; i < weeks; i++) {
    weeksData.push(dates.slice(i * 7, (i + 1) * 7));
  }

  const getIntensity = (value) => {
    if (value === 0) return "bg-gray-100";
    const percentage = (value / maxValue) * 100;
    if (percentage < 25) return "bg-green-200";
    if (percentage < 50) return "bg-green-400";
    if (percentage < 75) return "bg-green-600";
    return "bg-green-800";
  };

  const dayLabels = ["D", "L", "M", "X", "J", "V", "S"];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-gray-500 pt-4">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1 overflow-x-auto">
            {weeksData.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      "w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all",
                      getIntensity(day.value)
                    )}
                    title={`${day.date}: ${day.value} actividades`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm" />
            <div className="w-3 h-3 bg-green-200 rounded-sm" />
            <div className="w-3 h-3 bg-green-400 rounded-sm" />
            <div className="w-3 h-3 bg-green-600 rounded-sm" />
            <div className="w-3 h-3 bg-green-800 rounded-sm" />
          </div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  );
}
