// Export all API modules
export { authAPI } from './auth';
export { usersAPI } from './users';
export { areasAPI } from './areas';
export { projectsAPI } from './projects';
export { tasksAPI } from './tasks';
export { commentsAPI } from './comments';
export { activitiesAPI } from './activities';
export { statsAPI } from './stats';
export { default as apiClient } from './client';

// NEW: Export new API modules (Phase 2 & 4)
export * from './requirements';
export * from './incidents';
export * from './processes';
export * from './dashboard';

// Backward compatibility - simulate Base44 structure
import { authAPI } from './auth';
import { activitiesAPI } from './activities';
import { projectsAPI } from './projects';

export const base44 = {
  auth: {
    me: async () => {
      return await authAPI.me();
    },
    login: async (email, password) => {
      const result = await authAPI.login({ email, password });
      return result.user;
    },
    logout: () => {
      authAPI.logout();
    }
  },
  entities: {
    Activity: {
      filter: async (filters, sort) => {
        return await activitiesAPI.getAll(filters);
      },
      create: async (data) => {
        return await activitiesAPI.create(data);
      },
      update: async (id, data) => {
        return await activitiesAPI.update(id, data);
      },
      delete: async (id) => {
        return await activitiesAPI.delete(id);
      }
    },
    Project: {
      filter: async (filters, sort) => {
        return await projectsAPI.getAll(filters);
      },
      create: async (data) => {
        return await projectsAPI.create(data);
      },
      update: async (id, data) => {
        return await projectsAPI.update(id, data);
      },
      delete: async (id) => {
        return await projectsAPI.delete(id);
      }
    }
  }
};
