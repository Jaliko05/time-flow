import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

const ACTIVITY_TYPES = [
  { value: "all", label: "Todos los tipos" },
  { value: "plan_de_trabajo", label: "Plan de Trabajo" },
  { value: "apoyo_solicitado_por_otras_areas", label: "Apoyo a Otras Áreas" },
  { value: "teams", label: "Teams" },
  { value: "interno", label: "Interno" },
  { value: "sesion", label: "Sesión" },
  { value: "investigacion", label: "Investigación" },
  { value: "prototipado", label: "Prototipado" },
  { value: "disenos", label: "Diseños" },
  { value: "pruebas", label: "Pruebas" },
  { value: "documentacion", label: "Documentación" }
];

export default function AdminFilters({ filters, onFiltersChange, allUsers }) {
  const { data: allProjects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.filter({ is_active: true }),
  });

  const uniqueTeams = [...new Set(allUsers.map(u => u.team).filter(Boolean))];

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtros Avanzados</h3>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={filters.month}
              onChange={(e) => onFiltersChange({ ...filters, month: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user">Usuario</Label>
            <Select
              value={filters.user_email || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, user_email: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {allUsers.map(user => (
                  <SelectItem key={user.email} value={user.email}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Equipo</Label>
            <Select
              value={filters.team || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, team: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los equipos</SelectItem>
                {uniqueTeams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_type">Tipo</Label>
            <Select
              value={filters.activity_type || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, activity_type: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Proyecto</Label>
            <Select
              value={filters.project_id || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, project_id: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {allProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}