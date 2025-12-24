import apiClient from './client';

/**
 * Get process by ID
 * @param {number} id - Process ID
 * @returns {Promise} Process data with full details
 */
export const getProcess = async (id) => {
  const response = await apiClient.get(`/processes/${id}`);
  return response.data;
};

/**
 * Get all processes with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status
 * @param {number} params.requirement_id - Filter by requirement
 * @param {number} params.incident_id - Filter by incident
 * @param {number} params.activity_id - Filter by activity
 * @returns {Promise} Array of processes
 */
export const getProcesses = async (params = {}) => {
  const response = await apiClient.get('/processes', { params });
  return response.data;
};

/**
 * Create a new process
 * @param {Object} data - Process data
 * @param {string} data.name - Process name
 * @param {string} data.description - Process description
 * @param {number} data.estimated_hours - Estimated hours
 * @param {number} data.requirement_id - Optional requirement ID
 * @param {number} data.incident_id - Optional incident ID
 * @param {number} data.activity_id - Optional activity ID
 * @returns {Promise} Created process
 */
export const createProcess = async (data) => {
  const response = await apiClient.post('/processes', data);
  return response.data;
};

/**
 * Update an existing process
 * @param {number} id - Process ID
 * @param {Object} data - Updated process data
 * @returns {Promise} Updated process
 */
export const updateProcess = async (id, data) => {
  const response = await apiClient.put(`/processes/${id}`, data);
  return response.data;
};

/**
 * Delete a process
 * @param {number} id - Process ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteProcess = async (id) => {
  const response = await apiClient.delete(`/processes/${id}`);
  return response.data;
};

/**
 * Assign a user to a process
 * @param {number} processId - Process ID
 * @param {number} userId - User ID to assign
 * @returns {Promise} Assignment confirmation
 */
export const assignUserToProcess = async (processId, userId) => {
  const response = await apiClient.post(`/processes/${processId}/assign`, { user_id: userId });
  return response.data;
};

/**
 * Get assignments for a process
 * @param {number} processId - Process ID
 * @returns {Promise} Array of assigned users
 */
export const getProcessAssignments = async (processId) => {
  const response = await apiClient.get(`/processes/${processId}/assignments`);
  return response.data;
};

/**
 * Remove a user from a process
 * @param {number} processId - Process ID
 * @param {number} userId - User ID to remove
 * @returns {Promise} Removal confirmation
 */
export const removeUserFromProcess = async (processId, userId) => {
  const response = await apiClient.delete(`/processes/${processId}/unassign/${userId}`);
  return response.data;
};

/**
 * Add a dependency between processes
 * @param {number} processId - Process ID
 * @param {number} dependsOnId - ID of the process this depends on
 * @returns {Promise} Dependency confirmation
 */
export const addProcessDependency = async (processId, dependsOnId) => {
  const response = await apiClient.post(`/processes/${processId}/dependencies`, { depends_on_id: dependsOnId });
  return response.data;
};

/**
 * Remove a process dependency
 * @param {number} processId - Process ID
 * @param {number} dependsOnId - ID of the dependency to remove
 * @returns {Promise} Removal confirmation
 */
export const removeProcessDependency = async (processId, dependsOnId) => {
  const response = await apiClient.delete(`/processes/${processId}/dependencies/${dependsOnId}`);
  return response.data;
};

/**
 * Get dependency chain for a process
 * @param {number} processId - Process ID
 * @returns {Promise} Array of processes in dependency chain
 */
export const getProcessDependencyChain = async (processId) => {
  const response = await apiClient.get(`/processes/${processId}/dependency-chain`);
  return response.data;
};

/**
 * Get activities for a process
 * @param {number} processId - Process ID
 * @returns {Promise} Array of process activities
 */
export const getProcessActivities = async (processId) => {
  const response = await apiClient.get(`/processes/${processId}/activities`);
  return response.data;
};

/**
 * Create an activity within a process
 * @param {number} processId - Process ID
 * @param {Object} data - Activity data
 * @param {string} data.name - Activity name
 * @param {string} data.description - Activity description
 * @param {number} data.estimated_hours - Estimated hours
 * @param {number} data.depends_on_id - Optional dependency activity ID
 * @returns {Promise} Created process activity
 */
export const createProcessActivity = async (processId, data) => {
  const response = await apiClient.post(`/processes/${processId}/activities`, data);
  return response.data;
};

/**
 * Get a single process activity by ID
 * @param {number} activityId - Activity ID
 * @returns {Promise} Activity data
 */
export const getProcessActivity = async (activityId) => {
  const response = await apiClient.get(`/process-activities/${activityId}`);
  return response.data;
};

/**
 * Update a process activity
 * @param {number} activityId - Activity ID
 * @param {Object} data - Updated activity data
 * @returns {Promise} Updated activity
 */
export const updateProcessActivity = async (activityId, data) => {
  const response = await apiClient.put(`/process-activities/${activityId}`, data);
  return response.data;
};

/**
 * Validate if an activity can start (dependencies met)
 * @param {number} activityId - Activity ID
 * @returns {Promise} Validation result
 */
export const validateActivityDependencies = async (activityId) => {
  const response = await apiClient.get(`/process-activities/${activityId}/can-start`);
  return response.data;
};

/**
 * Get dependency chain for a process activity
 * @param {number} activityId - Activity ID
 * @returns {Promise} Array of activities in dependency chain
 */
export const getActivityDependencyChain = async (activityId) => {
  const response = await apiClient.get(`/process-activities/${activityId}/dependency-chain`);
  return response.data;
};

/**
 * Get activities blocked by a specific activity
 * @param {number} activityId - Activity ID
 * @returns {Promise} Array of blocked activities
 */
export const getBlockedActivities = async (activityId) => {
  const response = await apiClient.get(`/process-activities/${activityId}/blocked`);
  return response.data;
};

/**
 * Get user's workload
 * @param {number} userId - User ID
 * @returns {Promise} Workload metrics
 */
export const getUserWorkload = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/workload`);
  return response.data;
};

/**
 * Get processes assigned to a user
 * @param {number} userId - User ID
 * @returns {Promise} Array of assigned processes
 */
export const getUserProcesses = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/processes`);
  return response.data;
};

// API object for hooks compatibility
export const processesApi = {
  getAll: getProcesses,
  getById: getProcess,
  create: createProcess,
  update: updateProcess,
  delete: deleteProcess,
  assignUser: assignUserToProcess,
  removeUser: removeUserFromProcess,
  getAssignments: getProcessAssignments,
  getActivities: getProcessActivities,
  createActivity: createProcessActivity,
  getActivity: getProcessActivity,
  updateActivity: updateProcessActivity,
  validateDependencies: validateActivityDependencies,
  getDependencyChain: getActivityDependencyChain,
  getBlockedActivities: getBlockedActivities,
  getUserWorkload: getUserWorkload,
  getUserProcesses: getUserProcesses,
};
