import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { Calendar, User, FileText, Tag } from "lucide-react";

export default function RequirementCard({ requirement, onClick }) {
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
                REQ-{requirement.id}
              </Badge>
              {requirement.category && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {requirement.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate">
              {requirement.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Description */}
          {requirement.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {requirement.description}
            </p>
          )}

          {/* Status and Priority */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={requirement.status} variant="dot" />
            {requirement.priority && (
              <PriorityBadge priority={requirement.priority} variant="icon" />
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            {requirement.requestedBy && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="truncate">{requirement.requestedBy}</span>
              </div>
            )}
            {requirement.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(requirement.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Business Value */}
          {requirement.businessValue && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                <span>Valor de negocio: {requirement.businessValue}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
