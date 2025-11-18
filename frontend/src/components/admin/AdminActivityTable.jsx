import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ACTIVITY_TYPE_LABELS = {
  plan_de_trabajo: "Plan de Trabajo",
  apoyo_solicitado_por_otras_areas: "Apoyo a Otras Áreas",
  teams: "Teams",
  interno: "Interno",
  sesion: "Sesión",
  investigacion: "Investigación",
  prototipado: "Prototipado",
  disenos: "Diseños",
  pruebas: "Pruebas",
  documentacion: "Documentación"
};

export default function AdminActivityTable({ activities, isLoading }) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedRows, setExpandedRows] = useState(new Set());

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No se encontraron actividades</p>
      </div>
    );
  }

  const sortedActivities = [...activities].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => toggleSort('date')} className="gap-1 p-0 h-auto">
                Fecha
                {sortField === 'date' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => toggleSort('user_name')} className="gap-1 p-0 h-auto">
                Usuario
                {sortField === 'user_name' && (
                  sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Actividad</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Horas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedActivities.map(activity => (
            <React.Fragment key={activity.id}>
              <TableRow 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleRow(activity.id)}
              >
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    {expandedRows.has(activity.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  {format(new Date(activity.date), 'd MMM', { locale: es })}
                </TableCell>
                <TableCell>{activity.user_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{activity.team}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {activity.project_name || activity.activity_name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {activity.execution_time}h
                </TableCell>
              </TableRow>
              
              {expandedRows.has(activity.id) && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/30">
                    <div className="p-4 space-y-2">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Actividad Completa</p>
                          <p className="text-sm text-foreground">{activity.activity_name}</p>
                        </div>
                        {activity.project_name && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Proyecto</p>
                            <p className="text-sm text-foreground">{activity.project_name}</p>
                          </div>
                        )}
                        {activity.other_area && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Área Solicitante</p>
                            <p className="text-sm text-foreground">{activity.other_area}</p>
                          </div>
                        )}
                      </div>
                      {activity.observations && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Observaciones</p>
                          <p className="text-sm text-foreground">{activity.observations}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}