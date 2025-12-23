import apiClient from './client';

/**
 * Projects API
 */
export const projectsAPI = {
  /**
   * Get all projects
   * @param {object} params - Query parameters (area_id, created_by, active)
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/projects', { params });
    return response.data.data;
  },

  /**
   * Get project by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.data;
  },

  /**
   * Create new project
   * @param {object} data - {name, description, area_ids (array)}
   * @returns {Promise<object>}
   */
  create: async (data) => {
    const response = await apiClient.post('/projects', data);
    return response.data.data;
  },

  /**
   * Update project
   * @param {number} id
   * @param {object} data - {name, description, is_active, area_ids (array)}
   * @returns {Promise<object>}
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete project
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await apiClient.delete(`/projects/${id}`);
  },

  /**
   * Update project status
   * @param {number} id
   * @param {string} status - unassigned, assigned, in_progress, paused, completed
   * @returns {Promise<object>}
   */
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/projects/${id}/status`, { status });
    return response.data.data;
  },
};
