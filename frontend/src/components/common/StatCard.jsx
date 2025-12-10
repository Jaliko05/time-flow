import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Componente de tarjeta de estadística reutilizable
 * @param {string} title - Título de la estadística
 * @param {string|number} value - Valor a mostrar
 * @param {React.ReactNode} icon - Ícono de la estadística
 * @param {string} description - Descripción opcional
 * @param {string} trend - Tendencia (opcional): "up", "down", "neutral"
 * @param {string} className - Clases CSS adicionales
 */
export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={cn(
              "text-xs mt-1",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              trend === "neutral" && "text-gray-600"
            )}
          >
            {trend === "up" && "↗ En aumento"}
            {trend === "down" && "↘ En descenso"}
            {trend === "neutral" && "→ Estable"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
