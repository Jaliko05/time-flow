import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  AlertTriangle,
  Activity,
  Clock,
  Users,
  ChevronRight,
  ListTodo,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "bg-gray-100 border-gray-300 text-gray-700",
  },
  in_progress: {
    label: "En Progreso",
    color: "bg-blue-100 border-blue-400 text-blue-700",
  },
  completed: {
    label: "Completado",
    color: "bg-green-100 border-green-400 text-green-700",
  },
  backlog: {
    label: "Backlog",
    color: "bg-gray-100 border-gray-300 text-gray-700",
  },
  assigned: {
    label: "Asignado",
    color: "bg-orange-100 border-orange-400 text-orange-700",
  },
  paused: {
    label: "Detenido",
    color: "bg-red-100 border-red-400 text-red-700",
  },
  blocked: {
    label: "Bloqueado",
    color: "bg-red-100 border-red-400 text-red-700",
  },
  resolved: {
    label: "Resuelto",
    color: "bg-green-100 border-green-400 text-green-700",
  },
  open: {
    label: "Abierto",
    color: "bg-yellow-100 border-yellow-400 text-yellow-700",
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "bg-gray-50 text-gray-600" },
  medium: { label: "Media", color: "bg-blue-50 text-blue-600" },
  high: { label: "Alta", color: "bg-orange-50 text-orange-600" },
  critical: { label: "Crítica", color: "bg-red-50 text-red-600" },
};

const TYPE_CONFIG = {
  requirement: {
    icon: FileText,
    label: "REQ",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    borderColor: "border-purple-200 hover:border-purple-300",
    iconColor: "text-purple-600",
  },
  incident: {
    icon: AlertTriangle,
    label: "INC",
    bgColor: "bg-amber-50 hover:bg-amber-100",
    borderColor: "border-amber-200 hover:border-amber-300",
    iconColor: "text-amber-600",
  },
  activity: {
    icon: Activity,
    label: "ACT",
    bgColor: "bg-emerald-50 hover:bg-emerald-100",
    borderColor: "border-emerald-200 hover:border-emerald-300",
    iconColor: "text-emerald-600",
  },
};

export function ProcessCard({
  item,
  type,
  onClick,
  processCount = 0,
  activitiesCount = 0,
}) {
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.requirement;
  const Icon = typeConfig.icon;
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const priorityConfig = item.priority ? PRIORITY_CONFIG[item.priority] : null;

  return (
    <Card
      onClick={() => onClick?.(item)}
      className={cn(
        "cursor-pointer transition-all duration-200 border-2",
        typeConfig.bgColor,
        typeConfig.borderColor,
        "hover:shadow-md"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                `${typeConfig.iconColor} bg-white/50`
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-xs">
              {typeConfig.label}-{item.id}
            </Badge>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.name}</h3>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={cn("text-xs", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          {priorityConfig && (
            <Badge className={cn("text-xs", priorityConfig.color)}>
              {priorityConfig.label}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {item.estimated_hours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.estimated_hours}h
              </span>
            )}
            {activitiesCount > 0 && (
              <span className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                {activitiesCount} actividades
              </span>
            )}
          </div>
          {item.assigned_user && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {item.assigned_user.full_name?.split(" ")[0]}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProcessCardsGrid({
  items,
  type,
  onItemClick,
  emptyMessage = "No hay elementos",
  loading = false,
}) {
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.requirement;
  const Icon = typeConfig.icon;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon
          className={cn("h-12 w-12 mb-4", typeConfig.iconColor, "opacity-40")}
        />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ProcessCard
          key={item.id}
          item={item}
          type={type}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}

export default ProcessCard;
