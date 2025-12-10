import { cn } from "@/lib/utils";

/**
 * Componente para mostrar un estado vacío con ícono y mensaje
 * @param {React.ReactNode} icon - Ícono a mostrar
 * @param {string} title - Título del mensaje
 * @param {string} description - Descripción del mensaje
 * @param {React.ReactNode} action - Acción opcional (botón)
 * @param {string} className - Clases CSS adicionales
 */
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="flex justify-center mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      {title && (
        <p className="text-muted-foreground font-medium mb-2">{title}</p>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
