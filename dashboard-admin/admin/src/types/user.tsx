export interface RolePayload {
  name: string
  code: string
  status?: boolean
}

export interface Role {
  id: number
  name: string
  code: string
  status: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UserProfilePayload {
  firstName?: string
  lastName?: string
  avatar?: string | null
  bio?: string | null
  phone?: string | null
  date_of_birth?: string | null
}

export interface UserProfile {
  id: number
  userId: number
  avatar?: string | null
  bio?: string | null
  phone?: string | null
  date_of_birth?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AddressPayload {
  receiver_name: string
  phone: string
  street: string
  city: string
  status?: boolean
}

export interface Address {
  id: number
  userId: number
  receiver_name: string
  phone: string
  street: string
  city: string
  status: boolean
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: number
  firstName: string
  lastName?: string | null
  email: string
  status: boolean
  createdAt?: string
  updatedAt?: string
  Roles?: Role[]
  profile?: UserProfile | null
}

