import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUp, Minus } from "lucide-react";

export default function PriorityBadge({
  priority,
  variant = "default",
  className = "",
}) {
  const getPriorityConfig = (priority) => {
    const configs = {
      Crítica: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: AlertCircle,
        iconColor: "text-red-600",
      },
      Alta: {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        icon: ArrowUp,
        iconColor: "text-orange-600",
      },
      Media: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Minus,
        iconColor: "text-yellow-600",
      },
      Baja: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: Minus,
        iconColor: "text-green-600",
      },
    };

    return configs[priority] || configs["Media"];
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  if (variant === "icon") {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 ${config.color} ${className}`}
      >
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {priority}
      </Badge>
    );
  }

  if (variant === "simple") {
    return (
      <Badge variant="outline" className={`${config.color} ${className}`}>
        {priority}
      </Badge>
    );
  }

  // Default variant with icon
  return (
    <Badge variant="outline" className={`gap-1.5 ${config.color} ${className}`}>
      <Icon className={`h-3 w-3 ${config.iconColor}`} />
      {priority}
    </Badge>
  );
}
