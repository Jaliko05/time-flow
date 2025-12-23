import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function SeverityBadge({
  severity,
  variant = "default",
  className = "",
}) {
  const getSeverityConfig = (severity) => {
    const configs = {
      Crítica: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: AlertTriangle,
        iconColor: "text-red-600",
      },
      Alta: {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        icon: AlertCircle,
        iconColor: "text-orange-600",
      },
      Media: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: AlertCircle,
        iconColor: "text-yellow-600",
      },
      Baja: {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Info,
        iconColor: "text-blue-600",
      },
    };

    return configs[severity] || configs["Media"];
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  if (variant === "icon") {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 ${config.color} ${className}`}
      >
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {severity}
      </Badge>
    );
  }

  if (variant === "simple") {
    return (
      <Badge variant="outline" className={`${config.color} ${className}`}>
        {severity}
      </Badge>
    );
  }

  // Default variant with icon
  return (
    <Badge variant="outline" className={`gap-1.5 ${config.color} ${className}`}>
      <Icon className={`h-3 w-3 ${config.iconColor}`} />
      {severity}
    </Badge>
  );
}
