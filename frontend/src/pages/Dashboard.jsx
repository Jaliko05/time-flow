import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activitiesAPI, statsAPI, projectsAPI } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import DailyProgressBar from "../components/dashboard/DailyProgressBar";
import QuickActivityForm from "../components/dashboard/QuickActivityForm";
import TodayActivities from "../components/dashboard/TodayActivities";
import WeeklySummary from "../components/dashboard/WeeklySummary";
import SuperAdminDashboard from "../components/dashboard/SuperAdminDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import UserDashboard from "../components/dashboard/UserDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  // Si es SuperAdmin, mostrar dashboard administrativo global
  if (user?.role === "superadmin") {
    return <SuperAdminDashboard />;
  }

  // Si es Admin, mostrar dashboard administrativo de área
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  // Si es User, mostrar dashboard con backlog y actividades
  if (user?.role === "user") {
    return <UserDashboard user={user} />;
  }

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
