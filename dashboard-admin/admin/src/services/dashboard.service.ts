import api from './lib/axios'
import type { OrderReport } from '@/types/order'

export const getDashboardReport = async (params?: {
  from?: string
  to?: string
}): Promise<OrderReport | null> => {
  const res = (await api.get('/order/admin/report', { params })) as unknown as {
    data?: OrderReport
  }
  return res?.data || null
}

export const exportDashboardReport = async (params?: {
  from?: string
  to?: string
}): Promise<void> => {
  const blob = (await api.get('/order/admin/report/export', {
    params,
    responseType: 'blob',
  })) as unknown as Blob

  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `order-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

