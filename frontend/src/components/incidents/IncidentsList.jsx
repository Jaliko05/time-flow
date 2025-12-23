import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig = {
  open: { label: "Abierto", variant: "destructive" },
  in_progress: { label: "En Progreso", variant: "default" },
  resolved: { label: "Resuelto", variant: "secondary" },
  closed: { label: "Cerrado", variant: "outline" },
};

const severityConfig = {
  low: { label: "Baja", className: "bg-green-100 text-green-800", icon: null },
  medium: {
    label: "Media",
    className: "bg-yellow-100 text-yellow-800",
    icon: null,
  },
  high: {
    label: "Alta",
    className: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
  },
  critical: {
    label: "Crítica",
    className: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
};

export default function IncidentsList({
  incidents,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
    const matchesSeverity =
      severityFilter === "all" || inc.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Ordenar: críticos primero
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay incidentes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Excelente! No se han reportado incidentes para este proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar incidentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="open">Abierto</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="resolved">Resuelto</SelectItem>
            <SelectItem value="closed">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las severidades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reportado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIncidents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron incidentes con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              sortedIncidents.map((incident) => {
                const SeverityIcon = severityConfig[incident.severity]?.icon;
                return (
                  <TableRow
                    key={incident.id}
                    className={cn(
                      incident.severity === "critical" &&
                        incident.status !== "closed" &&
                        "bg-red-50"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {SeverityIcon && (
                          <SeverityIcon className="h-4 w-4 text-destructive" />
                        )}
                        {incident.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {incident.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          severityConfig[incident.severity]?.className
                        )}
                        variant="outline"
                      >
                        {severityConfig[incident.severity]?.label ||
                          incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusConfig[incident.status]?.variant || "secondary"
                        }
                      >
                        {statusConfig[incident.status]?.label ||
                          incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {incident.created_at
                        ? formatDistanceToNow(new Date(incident.created_at), {
                            addSuffix: true,
                            locale: es,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(incident)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(incident.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
