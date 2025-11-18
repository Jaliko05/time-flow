import apiClient from './client';

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: object}>}
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data;
  },

  /**
   * Get current user
   * @returns {Promise<object>}
   */
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /**
   * Logout (client-side only)
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
