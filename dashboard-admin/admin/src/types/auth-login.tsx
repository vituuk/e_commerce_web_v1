export interface AuthLoginPayload {
  email: string
  password: string
}

export interface AuthRegisterPayload {
  firstName: string
  lastName?: string
  email: string
  password: string
  status?: boolean
  roles?: string[]
}

export interface AuthUserIdentity {
  id: number
  email: string
  fullName: string
  roles: string[]
}

export interface AuthLoginResponse {
  message?: string
  token: string
  roles: string[]
  user?: AuthUserIdentity
}

