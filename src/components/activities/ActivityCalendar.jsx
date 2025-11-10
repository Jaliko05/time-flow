import React from "react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";

export default function ActivityCalendar({ activities, month, onActivityClick }) {
  const monthStart = startOfMonth(new Date(month + '-01'));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getActivitiesForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return activities.filter(act => act.date === dateStr);
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
        <div key={i} className="text-center font-semibold text-sm text-muted-foreground p-2">
          {day}
        </div>
      ))}
      
      {days.map(day => {
        const dayActivities = getActivitiesForDay(day);
        const totalHours = dayActivities.reduce((sum, act) => sum + (act.execution_time || 0), 0);
        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        
        return (
          <div
            key={day.toString()}
            className={`min-h-24 p-2 border border-border rounded-lg ${
              isToday ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
            } transition-colors cursor-pointer`}
          >
            <div className="font-medium text-sm text-foreground mb-1">
              {format(day, 'd')}
            </div>
            {totalHours > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalHours.toFixed(1)}h
              </Badge>
            )}
            <div className="mt-1 space-y-1">
              {dayActivities.slice(0, 2).map(act => (
                <div
                  key={act.id}
                  onClick={() => onActivityClick(act)}
                  className="text-xs p-1 bg-muted rounded truncate hover:bg-accent"
                >
                  {act.activity_name}
                </div>
              ))}
              {dayActivities.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{dayActivities.length - 2} más
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}