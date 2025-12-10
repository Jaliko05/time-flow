// Hooks personalizados para lógica de negocio reutilizable

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI } from "@/api";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para gestionar proyectos de un usuario
 * @param {Object} user - Usuario actual
 * @returns {Object} - Proyectos, loading state y mutaciones
 */
export function useUserProjects(user) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: () => projectsAPI.getAll({ user_id: user.id }),
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: (newProject) => projectsAPI.create(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Proyecto creado",
        description: "Tu proyecto personal ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el proyecto",
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
  };
}

/**
 * Hook para gestionar proyectos con filtros basados en rol
 * @param {Object} user - Usuario actual
 * @returns {Object} - Proyectos filtrados y mutaciones
 */
export function useProjects(user) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: async () => {
      const params = {};

      if (user?.role === "user") {
        params.user_id = user.id;
      } else if (user?.role === "admin" && user?.area_id) {
        params.area_id = user.area_id;
      }

      return await projectsAPI.getAll(params);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      projectsAPI.create({
        ...data,
        creator_id: user.id,
        area_id: user.area_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Éxito",
        description: "Proyecto creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el proyecto",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => projectsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Éxito",
        description: "Proyecto actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el proyecto",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Éxito",
        description: "Proyecto eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el proyecto",
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    isLoading,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
