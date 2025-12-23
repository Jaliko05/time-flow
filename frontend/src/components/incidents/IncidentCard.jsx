import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";
import SeverityBadge from "@/components/common/SeverityBadge";
import { Calendar, User, AlertTriangle, Tag } from "lucide-react";

export default function IncidentCard({ incident, onClick }) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                INC-{incident.id}
              </Badge>
              {incident.category && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {incident.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate">{incident.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Description */}
          {incident.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {incident.description}
            </p>
          )}

          {/* Status and Severity */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={incident.status} variant="dot" />
            {incident.severity && (
              <SeverityBadge severity={incident.severity} variant="icon" />
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            {incident.reportedBy && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="truncate">{incident.reportedBy}</span>
              </div>
            )}
            {incident.reportedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(incident.reportedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Impact */}
          {incident.impact && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertTriangle className="h-3 w-3" />
                <span>Impacto: {incident.impact}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
