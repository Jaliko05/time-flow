import apiClient from './client';

/**
 * Activities API
 */
export const activitiesAPI = {
  /**
   * Get all activities
   * @param {object} params - Query parameters (user_id, user_email, area_id, project_id, activity_type, date, month, date_from, date_to)
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/activities', { params });
    return response.data.data;
  },

  /**
   * Get activity by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/activities/${id}`);
    return response.data.data;
  },

  /**
   * Create new activity
   * @param {object} data - Activity data
   * @returns {Promise<object>}
   */
  create: async (data) => {
    const response = await apiClient.post('/activities', data);
    return response.data.data;
  },

  /**
   * Update activity
   * @param {number} id
   * @param {object} data - Activity data
   * @returns {Promise<object>}
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/activities/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete activity
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await apiClient.delete(`/activities/${id}`);
  },

  /**
   * Get activity statistics
   * @param {object} params - Query parameters (user_id, area_id, month, date_from, date_to)
   * @returns {Promise<object>}
   */
  getStats: async (params = {}) => {
    const response = await apiClient.get('/activities/stats', { params });
    return response.data.data;
  },
};
