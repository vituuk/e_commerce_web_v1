import { useMutation, useQuery } from '@tanstack/react-query'
import { exportDashboardReport, getDashboardReport } from '@/services/dashboard.service'

export const useDashboardReport = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ['dashboard-report', params?.from, params?.to],
    queryFn: () => getDashboardReport(params),
  })
}

export const useExportDashboardReport = () => {
  return useMutation({
    mutationFn: (params?: { from?: string; to?: string }) => exportDashboardReport(params),
  })
}

