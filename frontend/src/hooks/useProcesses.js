import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { processesApi } from '@/api/processes';
import { toast } from '@/hooks/use-toast';

export function useProcesses(filters = {}) {
  return useQuery({
    queryKey: ['processes', filters],
    queryFn: () => processesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProcess(id) {
  return useQuery({
    queryKey: ['process', id],
    queryFn: () => processesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: 'Éxito',
        description: 'Proceso creado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el proceso',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => processesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.id] });
      toast({
        title: 'Éxito',
        description: 'Proceso actualizado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el proceso',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: 'Éxito',
        description: 'Proceso eliminado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el proceso',
        variant: 'destructive',
      });
    },
  });
}

// Activity hooks for processes
export function useProcessActivities(processId) {
  return useQuery({
    queryKey: ['process-activities', processId],
    queryFn: () => processesApi.getActivities(processId),
    enabled: !!processId,
  });
}

export function useCreateProcessActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ processId, data }) => processesApi.createActivity(processId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-activities', variables.processId] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.processId] });
      toast({
        title: 'Éxito',
        description: 'Actividad creada correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la actividad',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProcessActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ processId, activityId, data }) => 
      processesApi.updateActivity(processId, activityId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['process-activities', variables.processId] });
      queryClient.invalidateQueries({ queryKey: ['process', variables.processId] });
      toast({
        title: 'Éxito',
        description: 'Actividad actualizada correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la actividad',
        variant: 'destructive',
      });
    },
  });
}
