import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * Badge de estado de proyecto/tarea
 */
export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unassigned;

  return (
    <Badge variant="outline" className={cn("border", config.color, className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Badge de prioridad
 */
export function PriorityBadge({ priority, showIcon = true, className }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  return (
    <Badge
      variant="secondary"
      className={cn("text-xs", config.color, className)}
    >
      {showIcon && config.icon} {config.label}
    </Badge>
  );
}

/**
 * Badge genérico personalizable
 */
export function CustomBadge({
  label,
  color = "bg-gray-100 text-gray-700",
  icon,
  className,
}) {
  return (
    <Badge variant="secondary" className={cn("text-xs", color, className)}>
      {icon} {label}
    </Badge>
  );
}
