import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, TrendingUp, Calendar } from "lucide-react";

export default function AdminStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Horas
          </CardTitle>
          <Clock className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalHours.toFixed(2)}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Este período
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Usuarios Activos
          </CardTitle>
          <Users className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.uniqueUsers}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Con actividades
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Promedio Diario
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.dailyAverage.toFixed(2)}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por día trabajado
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Últimos 7 Días
          </CardTitle>
          <Calendar className="w-4 h-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.weeklyHours.toFixed(2)}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Esta semana
          </p>
        </CardContent>
      </Card>
    </div>
  );
}