import api from './lib/axios'
import type { Address, AddressPayload, Role, RolePayload, User } from '@/types/user'
import type { AuthRegisterPayload } from '@/types/auth-login'

export const getCustomers = async (search?: string): Promise<{ data: User[] }> => {
  const res = (await api.get('/auth/getData')) as unknown as { data?: User[] }
  const all = res?.data || []
  if (!search?.trim()) return { data: all }
  const q = search.toLowerCase()
  return {
    data: all.filter(
      (u) =>
        `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    ),
  }
}

export const createCustomer = async (request: AuthRegisterPayload) => {
  return await api.post('/auth/user/register', request)
}

export const getAddresses = async (params?: {
  q?: string
  city?: string
  page?: number
  limit?: number
}): Promise<{ data: Address[] }> => {
  const res = (await api.get('/address', {
    params: { limit: 100, ...params },
  })) as unknown as { data?: Address[] }
  return { data: res?.data || [] }
}

export const getDefaultAddress = async (): Promise<Address | null> => {
  const res = (await api.get('/address/default')) as unknown as { data?: Address }
  return res?.data || null
}

export const createAddress = async (request: AddressPayload): Promise<Address> => {
  const res = (await api.post('/address', request)) as unknown as { data: Address }
  return res.data
}

export const updateAddress = async (
  id: number | string,
  request: Partial<AddressPayload>,
): Promise<Address> => {
  const res = (await api.put(`/address/${id}`, request)) as unknown as { data: Address }
  return res.data
}

export const setDefaultAddress = async (id: number | string): Promise<Address> => {
  const res = (await api.patch(`/address/${id}/default`)) as unknown as { data: Address }
  return res.data
}

export const deleteAddress = async (id: number | string) => {
  return await api.delete(`/address/${id}`)
}

export const getRoles = async (search?: string): Promise<{ data: Role[] }> => {
  const res = (await api.get('/role', {
    params: { q: search || undefined, limit: 100 },
  })) as unknown as { data?: Role[] }
  return { data: res?.data || [] }
}

export const createRole = async (request: RolePayload): Promise<Role> => {
  const res = (await api.post('/role', request)) as unknown as { data: Role }
  return res.data
}

export const updateRole = async (
  id: number | string,
  request: Partial<RolePayload>,
): Promise<Role> => {
  const res = (await api.put(`/role/${id}`, request)) as unknown as { data: Role }
  return res.data
}

export const deleteRole = async (id: number | string) => {
  return await api.delete(`/role/${id}`)
}

function extractRoleCodes(
  res: { data?: { roles?: Array<string | { code: string }> }; roles?: Array<string | { code: string }> } | undefined,
): string[] {
  const raw = res?.data?.roles || res?.roles || []
  return raw.map((r) => (typeof r === 'string' ? r : r.code))
}

export const getUserRoles = async (userId: number | string): Promise<string[]> => {
  const res = (await api.get(`/user-role/${userId}`)) as unknown as {
    data?: { roles?: Array<string | { code: string }> }
    roles?: Array<string | { code: string }>
  }
  return extractRoleCodes(res)
}

export const assignUserRoles = async (
  userId: number | string,
  roles: string[],
): Promise<string[]> => {
  const res = (await api.post(`/user-role/${userId}`, { roles })) as unknown as {
    data?: { roles?: Array<string | { code: string }> }
    roles?: Array<string | { code: string }>
  }
  return extractRoleCodes(res)
}

export const replaceUserRoles = async (
  userId: number | string,
  roles: string[],
): Promise<string[]> => {
  const res = (await api.put(`/user-role/${userId}`, { roles })) as unknown as {
    data?: { roles?: Array<string | { code: string }> }
    roles?: Array<string | { code: string }>
  }
  return extractRoleCodes(res)
}

export const removeUserRole = async (userId: number | string, code: string) => {
  return await api.delete(`/user-role/${userId}/${code}`)
}
