import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '@/api/incidents';
import { toast } from '@/hooks/use-toast';

export function useIncidents(filters = {}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => incidentsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useIncident(id) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incidentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: 'Éxito',
        description: 'Incidente creado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el incidente',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => incidentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', variables.id] });
      toast({
        title: 'Éxito',
        description: 'Incidente actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el incidente',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incidentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: 'Éxito',
        description: 'Incidente eliminado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el incidente',
        variant: 'destructive',
      });
    },
  });
}
