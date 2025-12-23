import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DailyProgressBar({ current, expected }) {
  const percentage = expected > 0 ? (current / expected) * 100 : 0;
  const remaining = Math.max(0, expected - current);
  const exceeded = Math.max(0, current - expected);

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getStatusMessage = () => {
    if (percentage >= 100 && exceeded === 0)
      return "¡Excelente! Has completado tu jornada";
    if (percentage > 100)
      return `¡Increíble! Has trabajado ${exceeded.toFixed(2)}h extra`;
    if (percentage >= 75)
      return `¡Muy bien! Te faltan ${remaining.toFixed(2)}h para completar`;
    if (percentage >= 50)
      return `Vas por buen camino, faltan ${remaining.toFixed(2)}h`;
    if (percentage >= 25) return `Continúa, faltan ${remaining.toFixed(2)}h`;
    return `Comienza a registrar (meta: ${expected}h)`;
  };

  const getIcon = () => {
    if (percentage >= 100)
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (percentage >= 75)
      return <TrendingUp className="w-5 h-5 text-blue-500" />;
    return <Target className="w-5 h-5 text-primary" />;
  };

  return (
    <Card className="border-border bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {getIcon()}
          Progreso de Jornada Diaria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0h</span>
            <span className="font-semibold">{percentage.toFixed(0)}%</span>
            <span>{expected}h</span>
          </div>
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 flex items-center justify-end px-2",
                getProgressColor()
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              {percentage >= 15 && (
                <span className="text-xs font-semibold text-white">
                  {current.toFixed(1)}h
                </span>
              )}
            </div>
            {/* Barra de excedente (si hay) */}
            {percentage > 100 && (
              <div
                className="absolute top-0 right-0 h-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-end px-2"
                style={{
                  width: `${Math.min((exceeded / expected) * 100, 100)}%`,
                }}
              >
                <span className="text-xs font-semibold text-white">
                  +{exceeded.toFixed(1)}h
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Registradas</p>
            <p className="text-xl font-bold text-foreground">
              {current.toFixed(1)}h
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-xl font-bold text-foreground">
              {expected.toFixed(1)}h
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {percentage >= 100 ? "Extra" : "Faltan"}
            </p>
            <p
              className={cn(
                "text-xl font-bold",
                percentage >= 100 ? "text-green-600" : "text-orange-600"
              )}
            >
              {percentage >= 100
                ? `+${exceeded.toFixed(1)}`
                : remaining.toFixed(1)}
              h
            </p>
          </div>
        </div>

        {/* Mensaje de estado */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-center text-foreground">
            {getStatusMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
