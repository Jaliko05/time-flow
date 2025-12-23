import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
    purple: "text-purple-600 bg-purple-50",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend > 0 ? (
              <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              vs mes anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
