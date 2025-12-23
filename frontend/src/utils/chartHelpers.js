/**
 * Chart data transformation utilities
 */

export const chartHelpers = {
  /**
   * Format number with K, M suffixes
   */
  formatNumber: (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  /**
   * Format percentage
   */
  formatPercent: (value, total) => {
    if (!total || total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  },

  /**
   * Format hours to readable string
   */
  formatHours: (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours >= 8) {
      const days = Math.floor(hours / 8);
      const remainingHours = hours % 8;
      return remainingHours > 0 
        ? `${days}d ${remainingHours.toFixed(1)}h`
        : `${days}d`;
    }
    return `${hours.toFixed(1)}h`;
  },

  /**
   * Get color based on value threshold
   */
  getColorByThreshold: (value, thresholds = { low: 30, medium: 70 }) => {
    if (value < thresholds.low) return '#10b981'; // green
    if (value < thresholds.medium) return '#f59e0b'; // orange
    return '#ef4444'; // red
  },

  /**
   * Group data by time period
   */
  groupByPeriod: (data, dateKey = 'date', period = 'day') => {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item[dateKey]);
      let key;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  },

  /**
   * Calculate moving average
   */
  calculateMovingAverage: (data, windowSize = 7) => {
    if (data.length < windowSize) return data;
    
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const sum = window.reduce((acc, val) => acc + (val.value || 0), 0);
      result.push({
        ...data[i],
        movingAverage: sum / window.length
      });
    }
    return result;
  },

  /**
   * Generate color palette
   */
  generateColorPalette: (count) => {
    const baseColors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // orange
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#84cc16', // lime
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generate additional colors if needed
    const colors = [...baseColors];
    while (colors.length < count) {
      colors.push(`hsl(${Math.random() * 360}, 70%, 50%)`);
    }
    return colors;
  },

  /**
   * Sort data by value
   */
  sortByValue: (data, ascending = false) => {
    return [...data].sort((a, b) => {
      const aVal = a.value || 0;
      const bVal = b.value || 0;
      return ascending ? aVal - bVal : bVal - aVal;
    });
  }
};
