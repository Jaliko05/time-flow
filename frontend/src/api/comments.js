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
