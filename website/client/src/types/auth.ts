export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface AuthUser {
  id: number | string
  firstName?: string
  lastName?: string
  fullName?: string
  email: string
  roles?: string[]
  status?: boolean
  isActive?: boolean
  avatar?: string | null
}

export interface AuthLoginPayload {
  email: string
  password: string
}

export interface AuthGoogleLoginPayload {
  accessToken?: string
  idToken?: string
  credential?: string
}

export interface AuthRegisterPayload {
  firstName?: string
  lastName?: string
  email: string
  password: string
  status?: boolean
}

export interface AuthLoginResponse {
  token?: string
  roles?: string[]
  expiresIn?: string
  user?: AuthUser
  message?: string
}

export interface UserProfile {
  id?: number | string
  userId?: number | string
  phone?: string | null
  date_of_birth?: string | null
  avatar?: string | null
  bio?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UserRoleEntry {
  code: string
  name?: string
}

export interface UserProfileData {
  id?: number | string
  firstName?: string
  lastName?: string
  email?: string
  status?: boolean
  profile?: UserProfile | null
  Roles?: UserRoleEntry[]
}

export interface ProfileInputPayload {
  firstName?: string
  lastName?: string
  avatar?: string | null
  bio?: string | null
  phone?: string | null
  date_of_birth?: string | null
}

export interface UserProfileForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  date_of_birth: string
  avatar: string
  bio: string
  newPassword: string
}
