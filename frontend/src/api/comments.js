import client from './client';

export const commentsAPI = {
  // Obtener comentarios de un proyecto
  getByProject: async (projectId) => {
    const response = await client.get(`/comments?project_id=${projectId}`);
    return response.data;
  },

  // Obtener comentarios de una tarea
  getByTask: async (taskId) => {
    const response = await client.get(`/comments?task_id=${taskId}`);
    return response.data;
  },

  // Crear comentario
  create: async (commentData) => {
    const response = await client.post('/comments', commentData);
    return response.data;
  },

  // Actualizar comentario
  update: async (id, content) => {
    const response = await client.patch(`/comments/${id}`, { content });
    return response.data;
  },

  // Eliminar comentario
  delete: async (id) => {
    const response = await client.delete(`/comments/${id}`);
    return response.data;
  }
};

/**
 * Get comments with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.entity_type - Type of entity (process_activity, task, project, etc.)
 * @param {number} params.entity_id - ID of the entity
 * @param {number} params.project_id - Project ID
 * @param {number} params.task_id - Task ID
 * @returns {Promise} Array of comments
 */
export const getComments = async (params = {}) => {
  const response = await client.get('/comments', { params });
  return response.data;
};

/**
 * Create a new comment
 * @param {Object} data - Comment data
 * @param {string} data.content - Comment content
 * @param {string} data.entity_type - Type of entity
 * @param {number} data.entity_id - ID of the entity
 * @returns {Promise} Created comment
 */
export const createComment = async (data) => {
  const response = await client.post('/comments', data);
  return response.data;
};

/**
 * Update a comment
 * @param {number} id - Comment ID
 * @param {Object} data - Updated comment data
 * @returns {Promise} Updated comment
 */
export const updateComment = async (id, data) => {
  const response = await client.patch(`/comments/${id}`, data);
  return response.data;
};

/**
 * Delete a comment
 * @param {number} id - Comment ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteComment = async (id) => {
  const response = await client.delete(`/comments/${id}`);
  return response.data;
};
