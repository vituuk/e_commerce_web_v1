import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createResourceRow,
  deleteResourceRow,
  fetchPaginatedResourceRows,
  fetchResourceRows,
  type ResourceQueryParams,
  updateResourceRow,
} from '@/api/resourceAdapter'

export const useResourceRows = (resourceKey: string) => {
  return useQuery({
    queryKey: ['resource', resourceKey],
    queryFn: () => fetchResourceRows(resourceKey),
    enabled: Boolean(resourceKey),
  })
}

export const usePaginatedResourceRows = (
  resourceKey: string,
  params?: ResourceQueryParams,
) => {
  return useQuery({
    queryKey: ['resource', resourceKey, params ?? {}],
    queryFn: () => fetchPaginatedResourceRows(resourceKey, params),
    enabled: Boolean(resourceKey),
  })
}

export const useCreateResourceRow = (resourceKey: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: string[]) => createResourceRow(resourceKey, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] })
    },
  })
}

export const useUpdateResourceRow = (resourceKey: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, oldRow }: { values: string[]; oldRow: string[] }) =>
      updateResourceRow(resourceKey, values, oldRow),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] })
    },
  })
}

export const useDeleteResourceRow = (resourceKey: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (row: string[]) => deleteResourceRow(resourceKey, row),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resource', resourceKey] })
    },
  })
}

