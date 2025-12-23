import apiClient from './client';

/**
 * Get requirement by ID
 * @param {number} id - Requirement ID
 * @returns {Promise} Requirement data
 */
export const getRequirement = async (id) => {
  const response = await apiClient.get(`/requirements/${id}`);
  return response.data;
};

/**
 * Get all requirements for a project
 * @param {number} projectId - Project ID
 * @returns {Promise} Array of requirements
 */
export const getProjectRequirements = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/requirements`);
  return response.data;
};

/**
 * Create a new requirement
 * @param {Object} data - Requirement data
 * @param {number} data.project_id - Project ID
 * @param {string} data.name - Requirement name
 * @param {string} data.description - Requirement description
 * @param {string} data.priority - Priority (low, medium, high, critical)
 * @param {string} data.status - Status (pending, in_progress, completed)
 * @returns {Promise} Created requirement
 */
export const createRequirement = async (data) => {
  const response = await apiClient.post('/requirements', data);
  return response.data;
};

/**
 * Update an existing requirement
 * @param {number} id - Requirement ID
 * @param {Object} data - Updated requirement data
 * @returns {Promise} Updated requirement
 */
export const updateRequirement = async (id, data) => {
  const response = await apiClient.put(`/requirements/${id}`, data);
  return response.data;
};

/**
 * Delete a requirement
 * @param {number} id - Requirement ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteRequirement = async (id) => {
  const response = await apiClient.delete(`/requirements/${id}`);
  return response.data;
};

/**
 * Create a process for a requirement
 * @param {number} requirementId - Requirement ID
 * @param {Object} data - Process data
 * @param {string} data.name - Process name
 * @param {string} data.description - Process description
 * @param {number} data.estimated_hours - Estimated hours
 * @returns {Promise} Created process
 */
export const createProcessForRequirement = async (requirementId, data) => {
  const response = await apiClient.post(`/requirements/${requirementId}/processes`, data);
  return response.data;
};
