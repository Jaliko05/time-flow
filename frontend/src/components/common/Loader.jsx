import { cn } from "@/lib/utils";

/**
 * Componente de loader/spinner centralizado
 * @param {string} size - Tamaño: "sm", "md", "lg"
 * @param {string} text - Texto opcional a mostrar
 * @param {string} className - Clases CSS adicionales
 */
export function Loader({ size = "md", text, className }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-b-2 border-primary",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}
