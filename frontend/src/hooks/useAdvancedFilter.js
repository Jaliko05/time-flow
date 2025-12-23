import { useState, useCallback, useMemo } from 'react';

/**
 * Hook para gestionar filtros avanzados
 * Maneja el estado de filtros, aplicación y limpieza
 */
export function useAdvancedFilter(initialFilters = {}) {
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Contar filtros activos (excluyendo valores vacíos)
  const activeFiltersCount = useMemo(() => {
    return Object.values(activeFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return value !== null && value !== undefined && value !== '';
    }).length;
  }, [activeFilters]);

  // Actualizar un filtro específico
  const setFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Actualizar múltiples filtros a la vez
  const setFilters = useCallback((filters) => {
    setActiveFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, []);

  // Limpiar un filtro específico
  const clearFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  // Obtener filtros como query params para API
  const getFilterParams = useCallback(() => {
    const params = {};
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params[key] = value.join(',');
      } else if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    });
    return params;
  }, [activeFilters]);

  // Toggle panel de filtros
  const toggleFilters = useCallback(() => {
    setIsFiltersOpen(prev => !prev);
  }, []);

  // Filtrar datos localmente (client-side)
  const filterData = useCallback((data, customFilterFn) => {
    if (!data || data.length === 0) return data;
    if (activeFiltersCount === 0) return data;

    if (customFilterFn) {
      return data.filter(item => customFilterFn(item, activeFilters));
    }

    // Filtrado por defecto
    return data.filter(item => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        
        const itemValue = item[key];
        
        // Array filter (e.g., multiple selection)
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        // String filter (case insensitive contains)
        if (typeof value === 'string' && typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        
        // Exact match for other types
        return itemValue === value;
      });
    });
  }, [activeFilters, activeFiltersCount]);

  // Verificar si hay filtros activos
  const hasActiveFilters = activeFiltersCount > 0;

  // Obtener etiquetas de filtros activos para mostrar chips
  const getActiveFilterLabels = useCallback((filterDefinitions) => {
    const labels = [];
    Object.entries(activeFilters).forEach(([key, value]) => {
      const definition = filterDefinitions.find(f => f.key === key);
      if (!definition) return;

      if (Array.isArray(value) && value.length > 0) {
        value.forEach(v => {
          const option = definition.options?.find(o => o.value === v);
          labels.push({
            key,
            value: v,
            label: option?.label || v
          });
        });
      } else if (value) {
        labels.push({
          key,
          value,
          label: definition.label + ': ' + value
        });
      }
    });
    return labels;
  }, [activeFilters]);

  return {
    activeFilters,
    activeFiltersCount,
    hasActiveFilters,
    isFiltersOpen,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    toggleFilters,
    getFilterParams,
    filterData,
    getActiveFilterLabels
  };
}
