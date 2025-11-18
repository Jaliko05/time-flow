import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

export default function WeeklySummary({ user }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weekActivities = [] } = useQuery({
    queryKey: ['weekActivities', user?.email, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const activities = await base44.entities.Activity.filter({
        user_email: user?.email
      });
      
      return activities.filter(act => {
        const actDate = new Date(act.date);
        return actDate >= weekStart && actDate <= weekEnd;
      });
    },
    enabled: !!user,
  });

  const getHoursForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekActivities
      .filter(act => act.date === dateStr)
      .reduce((sum, act) => sum + (act.execution_time || 0), 0);
  };

  const totalWeekHours = weekActivities.reduce((sum, act) => sum + (act.execution_time || 0), 0);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="w-5 h-5 text-primary" />
          Resumen Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {weekDays.map(day => {
            const hours = getHoursForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div
                key={day.toString()}
                className={`flex items-center justify-between p-2 rounded ${
                  isToday ? 'bg-primary/10 border border-primary/20' : ''
                }`}
              >
                <span className={`text-sm ${isToday ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'EEEE', { locale: es })}
                </span>
                <span className={`text-sm font-medium ${
                  hours > 0 ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {hours.toFixed(2)}h
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Total Semanal</span>
            <span className="text-xl font-bold text-primary">{totalWeekHours.toFixed(2)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}