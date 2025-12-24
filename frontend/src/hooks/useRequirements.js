import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requirementsApi } from '@/api/requirements';
import { toast } from '@/hooks/use-toast';

export function useRequirements(projectId) {
  return useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => requirementsApi.getAll(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRequirement(id) {
  return useQuery({
    queryKey: ['requirement', id],
    queryFn: () => requirementsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requirementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      toast({
        title: 'Éxito',
        description: 'Requerimiento creado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el requerimiento',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => requirementsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      queryClient.invalidateQueries({ queryKey: ['requirement', variables.id] });
      toast({
        title: 'Éxito',
        description: 'Requerimiento actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el requerimiento',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requirementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      toast({
        title: 'Éxito',
        description: 'Requerimiento eliminado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el requerimiento',
        variant: 'destructive',
      });
    },
  });
}
