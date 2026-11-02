// Payload sent to server for Create and Update actions
export interface CategoryPayload {
  id?: number
  name: string
  slug?: string
  is_active?: boolean
}

// Entity returned by server from GET endpoints
export interface Category {
  id: number
  name: string
  slug: string
  is_active: boolean
  createdAt: string
  updatedAt?: string
}

