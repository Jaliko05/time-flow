import apiClient from './client';

/**
 * Areas API
 */
export const areasAPI = {
  /**
   * Get all areas
   * @param {object} params - Query parameters
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/areas', { params });
    return response.data.data;
  },

  /**
   * Get area by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/areas/${id}`);
    return response.data.data;
  },

  /**
   * Create new area (SuperAdmin only)
   * @param {object} data
   * @returns {Promise<object>}
   */
  create: async (data) => {
    const response = await apiClient.post('/areas', data);
    return response.data.data;
  },

  /**
   * Update area (SuperAdmin only)
   * @param {number} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/areas/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete area (SuperAdmin only)
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await apiClient.delete(`/areas/${id}`);
  },
};
