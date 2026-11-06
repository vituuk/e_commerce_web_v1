export interface DecodedTokenUser {
  id: number
  email: string
  fullName: string
  roles: string[]
  exp?: number
  iat?: number
}

const TOKEN_COOKIE_KEY = 'commerceos_admin_token'
const USER_STORAGE_KEY = 'commerceos_admin_user'
export const ADMIN_COOKIE_EXPIRY_HOURS = 2

export function isAdminRole(roles?: string[] | null): boolean {
  if (!Array.isArray(roles)) return false
  return roles.some((r) => {
    const code = String(r).toLowerCase()
    return code === 'admin' || code === 'superadmin'
  })
}

function decodeJwtPayload(token: string): DecodedTokenUser | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload) as DecodedTokenUser
  } catch {
    return null
  }
}

export function setAccessToken(token: string, expiryHours = ADMIN_COOKIE_EXPIRY_HOURS): void {
  if (typeof document === 'undefined') return
  const decoded = decodeJwtPayload(token)
  if (!decoded || !isAdminRole(decoded.roles)) {
    removeAccessToken()
    throw new Error('Access denied: Only admin or superadmin accounts can access this dashboard.')
  }

  const maxAgeSeconds = Math.floor(expiryHours * 60 * 60)
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()
  document.cookie = `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; expires=${expires}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`
  localStorage.removeItem(TOKEN_COOKIE_KEY)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(decoded))
}

export function removeAccessToken(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${TOKEN_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0; path=/; SameSite=Lax`
  localStorage.removeItem(TOKEN_COOKIE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookieMatch = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_COOKIE_KEY}=`))

  const rawToken = cookieMatch
    ? decodeURIComponent(cookieMatch.split('=').slice(1).join('=') || '')
    : null

  if (!rawToken) {
    localStorage.removeItem(TOKEN_COOKIE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }

  const decoded = decodeJwtPayload(rawToken)
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now()) || !isAdminRole(decoded.roles)) {
    removeAccessToken()
    return null
  }

  return rawToken
}

export function getUserFromToken(): DecodedTokenUser | null {
  const token = getAccessToken()
  if (!token) return null

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DecodedTokenUser
        if (isAdminRole(parsed?.roles)) return parsed
        removeAccessToken()
        return null
      } catch {
        // fallback to decoding the valid cookie token below
      }
    }
  }

  const decoded = decodeJwtPayload(token)
  if (decoded && isAdminRole(decoded.roles)) return decoded
  return null
}
