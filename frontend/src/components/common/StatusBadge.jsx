import { Badge } from "@/components/ui/badge";

export default function StatusBadge({
  status,
  variant = "default",
  className = "",
}) {
  const getStatusConfig = (status) => {
    const configs = {
      // Project Status
      Planificación: {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        dot: "bg-gray-500",
      },
      "En Progreso": {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        dot: "bg-blue-500",
      },
      "En Pausa": {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        dot: "bg-yellow-500",
      },
      Completado: {
        color: "bg-green-100 text-green-800 border-green-300",
        dot: "bg-green-500",
      },
      Cancelado: {
        color: "bg-red-100 text-red-800 border-red-300",
        dot: "bg-red-500",
      },

      // Activity Status
      Pendiente: {
        color: "bg-orange-100 text-orange-800 border-orange-300",
        dot: "bg-orange-500",
      },

      // Process Status
      Activo: {
        color: "bg-green-100 text-green-800 border-green-300",
        dot: "bg-green-500",
      },

      // Requirement Status
      Propuesta: {
        color: "bg-purple-100 text-purple-800 border-purple-300",
        dot: "bg-purple-500",
      },
      Aprobado: {
        color: "bg-green-100 text-green-800 border-green-300",
        dot: "bg-green-500",
      },
      Rechazado: {
        color: "bg-red-100 text-red-800 border-red-300",
        dot: "bg-red-500",
      },
      "En Revisión": {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        dot: "bg-blue-500",
      },

      // Incident Status
      Abierto: {
        color: "bg-red-100 text-red-800 border-red-300",
        dot: "bg-red-500",
      },
      "En Análisis": {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        dot: "bg-yellow-500",
      },
      Resuelto: {
        color: "bg-green-100 text-green-800 border-green-300",
        dot: "bg-green-500",
      },
      Cerrado: {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        dot: "bg-gray-500",
      },
    };

    return (
      configs[status] || {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        dot: "bg-gray-500",
      }
    );
  };

  const config = getStatusConfig(status);

  if (variant === "dot") {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 ${config.color} ${className}`}
      >
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        {status}
      </Badge>
    );
  }

  if (variant === "simple") {
    return (
      <Badge variant="outline" className={`${config.color} ${className}`}>
        {status}
      </Badge>
    );
  }

  // Default variant with dot
  return (
    <Badge variant="outline" className={`gap-1.5 ${config.color} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      {status}
    </Badge>
  );
}
