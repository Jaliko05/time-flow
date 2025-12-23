import { cn } from "@/lib/utils";

export default function DashboardLayout({ children, className = "" }) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function DashboardSection({
  title,
  description,
  children,
  className = "",
  action,
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
