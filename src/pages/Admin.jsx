import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { format } from "date-fns";

import AdminFilters from "../components/admin/AdminFilters";
import AdminActivityTable from "../components/admin/AdminActivityTable";
import AdminStatsCards from "../components/admin/AdminStatsCards";

const ACTIVITY_TYPE_LABELS = {
  plan_de_trabajo: "Plan de Trabajo",
  apoyo_solicitado_por_otras_areas: "Apoyo Solicitado por Otras Áreas",
  teams: "Teams",
  interno: "Interno",
  sesion: "Sesión",
  investigacion: "Investigación",
  prototipado: "Prototipado",
  disenos: "Diseños",
  pruebas: "Pruebas",
  documentacion: "Documentación"
};

const exportToExcel = (activities, filename = 'reporte_admin') => {
  const exportData = activities.map(activity => ({
    'Nombre': activity.user_name,
    'Equipo': activity.team,
    'Mes': format(new Date(activity.date), 'MMMM yyyy'),
    'Actividad': activity.project_name || activity.activity_name,
    'Tipo de Actividad': ACTIVITY_TYPE_LABELS[activity.activity_type] || activity.activity_type,
    'Área a la que se genera la actividad': activity.other_area || activity.team,
    'Tiempo de Ejecución (horas)': activity.execution_time,
    'Observaciones': activity.observations || ''
  }));

  const headers = Object.keys(exportData[0] || {});
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = row[header]?.toString() || '';
        return value.includes(',') || value.includes('"') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Admin() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    month: format(new Date(), 'yyyy-MM'),
    user_email: '',
    team: '',
    activity_type: '',
    project_id: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['adminActivities', filters],
    queryFn: async () => {
      let query = { month: filters.month };
      if (filters.user_email) query.user_email = filters.user_email;
      if (filters.team) query.team = filters.team;
      if (filters.activity_type) query.activity_type = filters.activity_type;
      if (filters.project_id) query.project_id = filters.project_id;
      
      return await base44.entities.Activity.filter(query, '-date');
    },
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const handleExport = () => {
    exportToExcel(allActivities, `reporte_admin_${filters.month}`);
  };

  const calculateStats = () => {
    const totalHours = allActivities.reduce((sum, act) => sum + (act.execution_time || 0), 0);
    const uniqueUsers = new Set(allActivities.map(act => act.user_email)).size;
    
    const groupedByDate = allActivities.reduce((acc, act) => {
      if (!acc[act.date]) acc[act.date] = 0;
      acc[act.date] += act.execution_time || 0;
      return acc;
    }, {});
    
    const dailyAverage = Object.values(groupedByDate).length > 0
      ? Object.values(groupedByDate).reduce((sum, h) => sum + h, 0) / Object.values(groupedByDate).length
      : 0;

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyHours = allActivities
      .filter(act => new Date(act.date) >= weekAgo)
      .reduce((sum, act) => sum + (act.execution_time || 0), 0);

    return { totalHours, uniqueUsers, dailyAverage, weeklyHours };
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              Vista consolidada de actividades de todos los usuarios
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={allActivities.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Reporte
          </Button>
        </div>

        <AdminStatsCards stats={stats} />

        <AdminFilters 
          filters={filters}
          onFiltersChange={setFilters}
          allUsers={allUsers}
        />

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Actividades Registradas ({allActivities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminActivityTable
              activities={allActivities}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}