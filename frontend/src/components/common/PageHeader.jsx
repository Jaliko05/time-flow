/**
 * Componente de encabezado de página reutilizable
 * @param {string} title - Título principal
 * @param {string} subtitle - Subtítulo o descripción
 * @param {React.ReactNode} actions - Botones u acciones (lado derecho)
 * @param {React.ReactNode} icon - Ícono opcional
 */
export function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-start gap-3">
        {icon && <div className="text-primary mt-1">{icon}</div>}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
