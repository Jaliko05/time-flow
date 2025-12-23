import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProcessCard({ process, onEdit, onDelete, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      Activo: "bg-green-500",
      "En Pausa": "bg-yellow-500",
      Completado: "bg-blue-500",
      Cancelado: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const completionPercentage = () => {
    if (!process.totalActivities || process.totalActivities === 0) return 0;
    return Math.round(
      (process.completedActivities / process.totalActivities) * 100
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1" onClick={onClick}>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderKanban className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1 truncate">
                {process.name}
              </CardTitle>
              <p className="text-sm text-gray-500 line-clamp-2">
                {process.description}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(process)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(process.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent onClick={onClick}>
        <div className="space-y-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  process.status
                )}`}
              />
              {process.status}
            </Badge>
            {process.requirementId && (
              <Badge variant="secondary">REQ-{process.requirementId}</Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-medium">{completionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage()}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {process.completedActivities || 0}/
                {process.totalActivities || 0} Actividades
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{process.assignedUsers || 0} Usuarios</span>
            </div>
          </div>

          {/* Dates */}
          {(process.startDate || process.endDate) && (
            <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t">
              <Calendar className="h-3 w-3" />
              <span>
                {process.startDate &&
                  new Date(process.startDate).toLocaleDateString()}
                {process.startDate && process.endDate && " - "}
                {process.endDate &&
                  new Date(process.endDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
