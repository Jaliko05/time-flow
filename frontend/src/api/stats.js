import apiClient from './client';

/**
 * Stats API (Admin and SuperAdmin only)
 */
export const statsAPI = {
  /**
   * Get area summaries
   * @param {object} params - Query parameters
   * @returns {Promise<Array>}
   */
  getAreasSummary: async (params = {}) => {
    const response = await apiClient.get('/stats/areas', { params });
    return response.data.data;
  },

  /**
   * Get user summaries
   * @param {object} params - Query parameters
   * @returns {Promise<Array>}
   */
  getUsersSummary: async (params = {}) => {
    const response = await apiClient.get('/stats/users', { params });
    return response.data.data;
  },

  /**
   * Get project summaries
   * @param {object} params - Query parameters
   * @returns {Promise<Array>}
   */
  getProjectsSummary: async (params = {}) => {
    const response = await apiClient.get('/stats/projects', { params });
    return response.data.data;
  },
};
