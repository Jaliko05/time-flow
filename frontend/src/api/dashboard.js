import apiClient from './client';

/**
 * Get SuperAdmin dashboard metrics (global view)
 * @returns {Promise} SuperAdmin metrics
 */
export const getSuperAdminDashboard = async () => {
  const response = await apiClient.get('/dashboard/superadmin');
  return response.data;
};

/**
 * Get Admin dashboard metrics (area-specific view)
 * @returns {Promise} Admin metrics for their area
 */
export const getAdminDashboard = async () => {
  const response = await apiClient.get('/dashboard/admin');
  return response.data;
};

/**
 * Get User dashboard metrics (personal view)
 * @returns {Promise} User personal metrics
 */
export const getUserDashboard = async () => {
  const response = await apiClient.get('/dashboard/user');
  return response.data;
};
