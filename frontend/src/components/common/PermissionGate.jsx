import { usePermissions } from "@/hooks/usePermissions";

/**
 * Componente que controla la visibilidad de elementos basado en permisos
 * @param {Object} props
 * @param {string|string[]} props.requires - Permiso(s) requerido(s) del hook usePermissions
 * @param {boolean} [props.requireAll=true] - Si se requieren todos los permisos (AND) o solo uno (OR)
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene permiso
 * @param {React.ReactNode} [props.fallback=null] - Contenido alternativo si no tiene permiso
 */
export function PermissionGate({
  requires,
  requireAll = true,
  children,
  fallback = null,
}) {
  const permissions = usePermissions();

  const requiredPermissions = Array.isArray(requires) ? requires : [requires];

  const hasPermission = requireAll
    ? requiredPermissions.every((perm) => permissions[perm])
    : requiredPermissions.some((perm) => permissions[perm]);

  if (!hasPermission) {
    return fallback;
  }

  return children;
}

/**
 * HOC para envolver componentes que requieren permisos
 * @param {React.ComponentType} Component - Componente a envolver
 * @param {string|string[]} requires - Permiso(s) requerido(s)
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.requireAll=true] - Si se requieren todos los permisos
 * @param {React.ReactNode} [options.fallback=null] - Contenido alternativo
 */
export function withPermission(Component, requires, options = {}) {
  const { requireAll = true, fallback = null } = options;

  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGate
        requires={requires}
        requireAll={requireAll}
        fallback={fallback}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * Hook para verificar un permiso específico
 * @param {string} permission - Nombre del permiso a verificar
 * @returns {boolean} Si tiene el permiso o no
 */
export function useHasPermission(permission) {
  const permissions = usePermissions();
  return !!permissions[permission];
}

/**
 * Hook para verificar múltiples permisos
 * @param {string[]} permissionList - Lista de permisos a verificar
 * @param {boolean} [requireAll=true] - Si se requieren todos o solo uno
 * @returns {boolean} Si cumple con los permisos requeridos
 */
export function useHasPermissions(permissionList, requireAll = true) {
  const permissions = usePermissions();

  if (requireAll) {
    return permissionList.every((perm) => permissions[perm]);
  }
  return permissionList.some((perm) => permissions[perm]);
}

export default PermissionGate;
