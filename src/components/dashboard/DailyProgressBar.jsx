import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

export default function DailyProgressBar({ current, expected, percentage }) {
  const getProgressColor = () => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getStatusMessage = () => {
    if (percentage >= 100) return "¡Excelente! Has completado tu jornada";
    if (percentage >= 75) return "¡Muy bien! Casi completas tu jornada";
    if (percentage >= 50) return "Vas por buen camino";
    if (percentage >= 25) return "Continúa registrando tus actividades";
    return "Comienza a registrar tus actividades del día";
  };

  return (
    <Card className="border-border bg-gradient-to-br from-card to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Target className="w-5 h-5 text-primary" />
          Progreso de Jornada Diaria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-4"
          />
          <div 
            className={`absolute inset-0 h-4 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Horas registradas</p>
            <p className="text-2xl font-bold text-foreground">{current.toFixed(2)}h</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Meta diaria</p>
            <p className="text-2xl font-bold text-foreground">{expected.toFixed(2)}h</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-center text-foreground">
            {getStatusMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}