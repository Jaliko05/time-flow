import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { activitiesAPI } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";

import ActivityFilters from "../components/activities/ActivityFilters";
import ActivityList from "../components/activities/ActivityList";
import ActivityEditDialog from "../components/activities/ActivityEditDialog";

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
  documentacion: "Documentación",
};

const exportToExcel = (activities, filename = "actividades") => {
  const exportData = activities.map((activity) => ({
    Nombre: activity.user_name,
    Equipo: activity.team,
    Mes: format(new Date(activity.date), "MMMM yyyy"),
    Actividad: activity.project_name || activity.activity_name,
    "Tipo de Actividad":
      ACTIVITY_TYPE_LABELS[activity.activity_type] || activity.activity_type,
    "Área a la que se genera la actividad":
      activity.other_area || activity.team,
    "Tiempo de Ejecución (horas)": activity.execution_time,
    Observaciones: activity.observations || "",
  }));

  const headers = Object.keys(exportData[0] || {});
  const csvContent = [
    headers.join(","),
    ...exportData.map((row) =>
      headers
        .map((header) => {
          const value = row[header]?.toString() || "";
          return value.includes(",") || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Activities() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    month: format(new Date(), "yyyy-MM"),
    project_id: "",
    activity_type: "",
  });
  const [editingActivity, setEditingActivity] = useState(null);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", user?.email, filters],
    queryFn: async () => {
      let query = { month: filters.month };

      // Apply role-based filtering
      if (user?.role === "user") {
        query.user_email = user.email;
      } else if (user?.role === "admin" && user?.area_id) {
        query.area_id = user.area_id;
      }
      // SuperAdmin sees all (no additional filter)

      if (filters.project_id) query.project_id = filters.project_id;
      if (filters.activity_type) query.activity_type = filters.activity_type;

      return await activitiesAPI.getAll(query);
    },
    enabled: !!user,
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, data }) => activitiesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setEditingActivity(null);
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id) => activitiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const handleExport = () => {
    exportToExcel(activities, `actividades_${filters.month}`);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Mis Actividades
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y revisa todas tus actividades registradas
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={activities.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar a Excel
          </Button>
        </div>

        <ActivityFilters
          filters={filters}
          onFiltersChange={setFilters}
          user={user}
        />

        <Card className="border-border">
          <CardContent className="p-6">
            <ActivityList
              activities={activities}
              isLoading={isLoading}
              onEdit={setEditingActivity}
              onDelete={(id) => deleteActivityMutation.mutate(id)}
            />
          </CardContent>
        </Card>

        {editingActivity && (
          <ActivityEditDialog
            activity={editingActivity}
            open={!!editingActivity}
            onClose={() => setEditingActivity(null)}
            onSave={(data) =>
              updateActivityMutation.mutate({
                id: editingActivity.id,
                data,
              })
            }
            isSubmitting={updateActivityMutation.isPending}
            user={user}
          />
        )}
      </div>
    </div>
  );
}
