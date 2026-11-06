import axios from 'axios'
import { addressApi } from './client'
import type { Address, AddressFormPayload, AddressQueryParams } from '@/types/address'

export const getAddresses = async (
  params: AddressQueryParams & Record<string, unknown> = { limit: 50 },
): Promise<Address[]> => {
  const res = await addressApi.list(params)
  return res.data?.data || []
}

export const getDefaultAddress = async (): Promise<Address | null> => {
  try {
    const res = await addressApi.getDefault()
    return res.data?.data || null
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null
    }
    throw err
  }
}

export const getAddressById = async (id: number | string): Promise<Address | null> => {
  const res = await addressApi.getOne(id)
  return res.data?.data || null
}

export const createAddress = async (payload: AddressFormPayload): Promise<Address | null> => {
  const res = await addressApi.create(payload)
  return res.data?.data || null
}

export const updateAddress = async (
  id: number | string,
  payload: AddressFormPayload,
): Promise<Address | null> => {
  const res = await addressApi.update(id, payload)
  return res.data?.data || null
}

export const setDefaultAddress = async (id: number | string): Promise<Address | null> => {
  const res = await addressApi.setDefault(id)
  return res.data?.data || null
}

export const removeAddress = async (id: number | string) => {
  const res = await addressApi.remove(id)
  return res.data
}
