import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/api/stats';

export function useDashboardMetrics(role, areaId = null) {
  const queryKey = role === 'SuperAdmin' 
    ? ['dashboard-metrics', 'superadmin']
    : ['dashboard-metrics', 'admin', areaId];

  const queryFn = role === 'SuperAdmin'
    ? () => statsApi.getSuperAdminDashboard()
    : () => statsApi.getAdminDashboard(areaId);

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: role === 'SuperAdmin' || !!areaId,
  });
}

export function useProjectMetrics(projectId) {
  return useQuery({
    queryKey: ['project-metrics', projectId],
    queryFn: () => statsApi.getProjectMetrics(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserMetrics(userId) {
  return useQuery({
    queryKey: ['user-metrics', userId],
    queryFn: () => statsApi.getUserMetrics(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAreaMetrics(areaId) {
  return useQuery({
    queryKey: ['area-metrics', areaId],
    queryFn: () => statsApi.getAreaMetrics(areaId),
    enabled: !!areaId,
    staleTime: 2 * 60 * 1000,
  });
}
