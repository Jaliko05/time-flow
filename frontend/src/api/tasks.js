import apiClient from './client';

/**
 * Tasks API
 */
export const tasksAPI = {
  /**
   * Get all tasks
   * @param {object} params - Query parameters (project_id, assigned_user_id, status, priority)
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/tasks', { params });
    return response.data.data;
  },

  /**
   * Get task by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data.data;
  },

  /**
   * Create new task
   * @param {object} data - Task data
   * @returns {Promise<object>}
   */
  create: async (data) => {
    const response = await apiClient.post('/tasks', data);
    return response.data.data;
  },

  /**
   * Update task
   * @param {number} id
   * @param {object} data - Task data
   * @returns {Promise<object>}
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data.data;
  },

  /**
   * Update task status
   * @param {number} id
   * @param {string} status - backlog, assigned, in_progress, paused, completed
   * @returns {Promise<object>}
   */
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Bulk update task order
   * @param {Array} tasks - Array of {id, order}
   * @returns {Promise<void>}
   */
  bulkUpdateOrder: async (tasks) => {
    const response = await apiClient.patch('/tasks/bulk-order', { tasks });
    return response.data;
  },

  /**
   * Delete task
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
