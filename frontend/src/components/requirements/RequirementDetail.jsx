import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/common/StatusBadge";
import PriorityBadge from "@/components/common/PriorityBadge";
import {
  Calendar,
  User,
  FileText,
  Tag,
  Edit,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

export default function RequirementDetail({
  requirement,
  onBack,
  onEdit,
  canEdit = false,
}) {
  if (!requirement) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Selecciona un requerimiento para ver sus detalles
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
          <Button onClick={() => onEdit(requirement)}>
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
              <Badge variant="outline">REQ-{requirement.id}</Badge>
              {requirement.category && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {requirement.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{requirement.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={requirement.status} variant="dot" />
              {requirement.priority && (
                <PriorityBadge priority={requirement.priority} variant="icon" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Descripción</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {requirement.description || "Sin descripción"}
            </p>
          </div>

          <Separator />

          {/* Business Value */}
          {requirement.businessValue && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2">Valor de Negocio</h3>
                <p className="text-gray-700">{requirement.businessValue}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Acceptance Criteria */}
          {requirement.acceptanceCriteria && (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Criterios de Aceptación
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {requirement.acceptanceCriteria}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirement.requestedBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Solicitado por</p>
                  <p className="font-medium">{requirement.requestedBy}</p>
                </div>
              </div>
            )}

            {requirement.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Fecha de creación</p>
                  <p className="font-medium">
                    {new Date(requirement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {requirement.updatedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Última actualización</p>
                  <p className="font-medium">
                    {new Date(requirement.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {requirement.estimatedEffort && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Esfuerzo estimado</p>
                  <p className="font-medium">{requirement.estimatedEffort}</p>
                </div>
              </div>
            )}
          </div>

          {/* Comments Count */}
          {requirement.comments && requirement.comments.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="h-4 w-4" />
                <span>{requirement.comments.length} comentario(s)</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
