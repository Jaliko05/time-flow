import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/common/StatusBadge";
import SeverityBadge from "@/components/common/SeverityBadge";
import {
  Calendar,
  User,
  AlertTriangle,
  Tag,
  Edit,
  ArrowLeft,
  MessageSquare,
  FileText,
} from "lucide-react";

export default function IncidentDetail({
  incident,
  onBack,
  onEdit,
  canEdit = false,
}) {
  if (!incident) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Selecciona un incidente para ver sus detalles
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        {canEdit && (
          <Button onClick={() => onEdit(incident)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">INC-{incident.id}</Badge>
              {incident.category && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {incident.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{incident.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={incident.status} variant="dot" />
              {incident.severity && (
                <SeverityBadge severity={incident.severity} variant="icon" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Descripción</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {incident.description || "Sin descripción"}
            </p>
          </div>

          <Separator />

          {/* Impact */}
          {incident.impact && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2">Impacto</h3>
                <p className="text-gray-700">{incident.impact}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Root Cause */}
          {incident.rootCause && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2">Causa Raíz</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {incident.rootCause}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Resolution */}
          {incident.resolution && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2">Resolución</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {incident.resolution}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incident.reportedBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Reportado por</p>
                  <p className="font-medium">{incident.reportedBy}</p>
                </div>
              </div>
            )}

            {incident.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Asignado a</p>
                  <p className="font-medium">{incident.assignedTo}</p>
                </div>
              </div>
            )}

            {incident.reportedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Fecha de reporte</p>
                  <p className="font-medium">
                    {new Date(incident.reportedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {incident.resolvedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Fecha de resolución</p>
                  <p className="font-medium">
                    {new Date(incident.resolvedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {incident.estimatedResolutionTime && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">
                    Tiempo estimado de resolución
                  </p>
                  <p className="font-medium">
                    {incident.estimatedResolutionTime}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Comments Count */}
          {incident.comments && incident.comments.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="h-4 w-4" />
                <span>{incident.comments.length} comentario(s)</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
