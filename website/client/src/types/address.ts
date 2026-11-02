export interface Address {
  id: number | string
  userId?: number | string
  receiver_name: string
  phone: string
  street: string
  city: string
  status?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AddressFormPayload {
  receiver_name: string
  phone: string
  street: string
  city: string
  status: boolean
}

export interface AddressQueryParams {
  city?: string
  q?: string
  page?: number
  limit?: number
}
