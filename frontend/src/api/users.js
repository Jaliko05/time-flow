import apiClient from './client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Users API
 */
export const usersAPI = {
  /**
   * Get all users (Admin/SuperAdmin only)
   * @param {object} params - Query parameters
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data.data;
  },

  /**
   * Get user by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  /**
   * Create new user (authenticated - Admin/SuperAdmin only)
   * @param {object} data
   * @returns {Promise<object>}
   */
  create: async (data) => {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  /**
   * Register new user (public - no authentication required)
   * @param {object} data
   * @returns {Promise<object>}
   */
  register: async (data) => {
    // Use axios directly without auth token
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data.data;
  },

  /**
   * Update user
   * @param {number} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  update: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete user (SuperAdmin only)
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await apiClient.delete(`/users/${id}`);
  },
};
