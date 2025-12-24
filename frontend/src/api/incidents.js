import apiClient from './client';

/**
 * Get incident by ID
 * @param {number} id - Incident ID
 * @returns {Promise} Incident data
 */
export const getIncident = async (id) => {
  const response = await apiClient.get(`/incidents/${id}`);
  return response.data;
};

/**
 * Get all incidents for a project
 * @param {number} projectId - Project ID
 * @returns {Promise} Array of incidents
 */
export const getProjectIncidents = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/incidents`);
  return response.data;
};

/**
 * Create a new incident (report)
 * @param {Object} data - Incident data
 * @param {number} data.project_id - Project ID
 * @param {string} data.name - Incident name
 * @param {string} data.description - Incident description
 * @param {string} data.severity - Severity (low, medium, high, critical)
 * @param {string} data.status - Status (open, in_progress, resolved, closed)
 * @returns {Promise} Created incident
 */
export const createIncident = async (data) => {
  const response = await apiClient.post('/incidents', data);
  return response.data;
};

/**
 * Update an existing incident
 * @param {number} id - Incident ID
 * @param {Object} data - Updated incident data
 * @returns {Promise} Updated incident
 */
export const updateIncident = async (id, data) => {
  const response = await apiClient.put(`/incidents/${id}`, data);
  return response.data;
};

/**
 * Resolve an incident
 * @param {number} id - Incident ID
 * @param {Object} data - Resolution data
 * @param {string} data.resolution_notes - Notes about the resolution
 * @returns {Promise} Updated incident
 */
export const resolveIncident = async (id, data) => {
  const response = await apiClient.put(`/incidents/${id}/resolve`, data);
  return response.data;
};

/**
 * Delete an incident
 * @param {number} id - Incident ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteIncident = async (id) => {
  const response = await apiClient.delete(`/incidents/${id}`);
  return response.data;
};

/**
 * Create a process for an incident
 * @param {number} incidentId - Incident ID
 * @param {Object} data - Process data
 * @param {string} data.name - Process name
 * @param {string} data.description - Process description
 * @param {number} data.estimated_hours - Estimated hours
 * @returns {Promise} Created process
 */
export const createProcessForIncident = async (incidentId, data) => {
  const response = await apiClient.post(`/incidents/${incidentId}/processes`, data);
  return response.data;
};

// API object for hooks compatibility
export const incidentsApi = {
  getAll: getProjectIncidents,
  getById: getIncident,
  create: createIncident,
  update: updateIncident,
  delete: deleteIncident,
  resolve: resolveIncident,
  createProcess: createProcessForIncident,
};
