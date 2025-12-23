import { useMemo } from 'react';

/**
 * Hook to transform data for chart components
 */
export function useChartData() {
  const transformForPieChart = (data, nameKey = 'name', valueKey = 'value') => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item[nameKey],
      value: item[valueKey]
    }));
  };

  const transformForBarChart = (data, xKey = 'name', yKey = 'value') => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      [xKey]: item[xKey] || item.name,
      [yKey]: item[yKey] || item.value
    }));
  };

  const transformForLineChart = (data, xKey = 'date', yKeys = ['value']) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const transformed = { [xKey]: item[xKey] };
      yKeys.forEach(key => {
        transformed[key] = item[key] || 0;
      });
      return transformed;
    });
  };

  const aggregateByStatus = (items) => {
    if (!Array.isArray(items)) return [];
    const statusCount = items.reduce((acc, item) => {
      const status = item.status || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const aggregateByPriority = (items) => {
    if (!Array.isArray(items)) return [];
    const priorityCount = items.reduce((acc, item) => {
      const priority = item.priority || 'Sin prioridad';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    transformForPieChart,
    transformForBarChart,
    transformForLineChart,
    aggregateByStatus,
    aggregateByPriority,
    calculateTrend
  };
}
