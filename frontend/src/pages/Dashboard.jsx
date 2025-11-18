import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activitiesAPI } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import DailyProgressBar from "../components/dashboard/DailyProgressBar";
import QuickActivityForm from "../components/dashboard/QuickActivityForm";
import TodayActivities from "../components/dashboard/TodayActivities";
import WeeklySummary from "../components/dashboard/WeeklySummary";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  const { data: todayActivities = [], isLoading } = useQuery({
    queryKey: ["activities", user?.email, today],
    queryFn: async () => {
      const params = { date: today };

      // Users see only their activities
      if (user?.role === "user") {
        params.user_email = user.email;
      }
      // Admins see their area's activities
      else if (user?.role === "admin" && user?.area_id) {
        params.area_id = user.area_id;
      }
      // SuperAdmins see all activities (no filter)

      return await activitiesAPI.getAll(params);
    },
    enabled: !!user,
  });

  const { data: monthActivities = [] } = useQuery({
    queryKey: ["activities", user?.email, currentMonth],
    queryFn: async () => {
      const params = { month: currentMonth };

      // Filter by role
      if (user?.role === "user") {
        params.user_email = user.email;
      } else if (user?.role === "admin" && user?.area_id) {
        params.area_id = user.area_id;
      }

      return await activitiesAPI.getAll(params);
    },
    enabled: !!user,
  });

  const createActivityMutation = useMutation({
    mutationFn: (activityData) => activitiesAPI.create(activityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => activitiesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => activitiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const handleCreateActivity = async (data) => {
    await createActivityMutation.mutateAsync({
      ...data,
      user_email: user.email,
      user_name: user.full_name,
      area_id: user.area_id,
      date: today,
      month: currentMonth,
    });
  };

  const calculateTodayHours = () => {
    return todayActivities.reduce(
      (sum, act) => sum + (act.execution_time || 0),
      0
    );
  };

  const calculateExpectedHours = () => {
    if (!user?.work_schedule) return 8;

    const dayName = format(new Date(), "EEEE", { locale: es }).toLowerCase();
    const daySchedule = user.work_schedule[dayName];

    if (!daySchedule?.enabled) return 0;

    const [startHour, startMin] = daySchedule.start.split(":").map(Number);
    const [endHour, endMin] = daySchedule.end.split(":").map(Number);

    let totalHours = endHour * 60 + endMin - (startHour * 60 + startMin);

    if (user.lunch_break?.enabled) {
      const [lunchStartHour, lunchStartMin] = user.lunch_break.start
        .split(":")
        .map(Number);
      const [lunchEndHour, lunchEndMin] = user.lunch_break.end
        .split(":")
        .map(Number);
      const lunchDuration =
        lunchEndHour * 60 + lunchEndMin - (lunchStartHour * 60 + lunchStartMin);
      totalHours -= lunchDuration;
    }

    return totalHours / 60;
  };

  const todayHours = calculateTodayHours();
  const expectedHours = calculateExpectedHours();
  const progressPercentage =
    expectedHours > 0 ? (todayHours / expectedHours) * 100 : 0;

  const monthTotalHours = monthActivities.reduce(
    (sum, act) => sum + (act.execution_time || 0),
    0
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              ¡Hola, {user.full_name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: es,
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas de Hoy
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {todayHours.toFixed(2)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {expectedHours.toFixed(2)}h esperadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progreso Diario
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {progressPercentage.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercentage >= 100
                  ? "¡Meta cumplida!"
                  : `${(expectedHours - todayHours).toFixed(2)}h restantes`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actividades Hoy
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {todayActivities.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">registradas</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas del Mes
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {monthTotalHours.toFixed(2)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthActivities.length} actividades
              </p>
            </CardContent>
          </Card>
        </div>

        <DailyProgressBar
          current={todayHours}
          expected={expectedHours}
          percentage={progressPercentage}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <QuickActivityForm
              onSubmit={handleCreateActivity}
              isSubmitting={createActivityMutation.isPending}
              user={user}
            />

            <TodayActivities
              activities={todayActivities}
              isLoading={isLoading}
              onUpdate={(id, data) =>
                updateActivityMutation.mutate({ id, data })
              }
              onDelete={(id) => deleteActivityMutation.mutate(id)}
            />
          </div>

          <div>
            <WeeklySummary user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
