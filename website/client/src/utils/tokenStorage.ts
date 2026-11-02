export interface DecodedTokenUser {
  id: number
  email: string
  fullName?: string
  firstName?: string
  lastName?: string
  roles: string[]
  exp?: number
  iat?: number
}

export const TOKEN_STORAGE_KEY = 'aura_user_token'
const USER_STORAGE_KEY = 'aura_user_data'
const LEGACY_TOKEN_STORAGE_KEY = 'ugmonk_token'
export const USER_COOKIE_EXPIRY_HOURS = 24
export const AUTH_UNAUTHORIZED_EVENT = 'aura-auth-unauthorized'

export function isUserRole(roles?: string[] | null): boolean {
  if (!Array.isArray(roles)) return false
  return roles.some((r) => String(r).toLowerCase() === 'user')
}

export function decodeJwtPayload(token: string): DecodedTokenUser | null {
  try {
    if (!token || token.startsWith('local-jwt-')) return null
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
    const parsed = JSON.parse(jsonPayload) as DecodedTokenUser
    if (parsed.fullName && (!parsed.firstName || !parsed.lastName)) {
      const nameParts = String(parsed.fullName).trim().split(/\s+/)
      parsed.firstName = parsed.firstName || nameParts[0] || ''
      parsed.lastName = parsed.lastName || nameParts.slice(1).join(' ') || ''
    }
    return parsed
  } catch {
    return null
  }
}

export function setAccessToken(token: string, expiryHours = USER_COOKIE_EXPIRY_HOURS): void {
  if (typeof document === 'undefined') return
  const decoded = decodeJwtPayload(token)
  if (!decoded || !isUserRole(decoded.roles)) {
    removeAccessToken()
    throw new Error('Access denied: Only customer accounts with the "user" role can sign in here.')
  }

  const maxAgeSeconds = Math.floor(expiryHours * 60 * 60)
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()
  document.cookie = `${TOKEN_STORAGE_KEY}=${encodeURIComponent(token)}; expires=${expires}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`

  try {
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(decoded))
  } catch {
    // ignore storage quota errors
  }
}

export function removeAccessToken(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0; path=/; SameSite=Lax`
  }
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookieMatch = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_STORAGE_KEY}=`))

  let rawToken = cookieMatch
    ? decodeURIComponent(cookieMatch.split('=').slice(1).join('=') || '')
    : null

  if (!rawToken) {
    try {
      const legacy = localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)
      if (legacy) {
        if (legacy.startsWith('local-jwt-')) {
          localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
        } else {
          rawToken = legacy
        }
      }
    } catch {
      // ignore
    }
  }

  if (!rawToken) {
    try {
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // ignore
    }
    return null
  }

  const decoded = decodeJwtPayload(rawToken)
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now()) || !isUserRole(decoded.roles)) {
    removeAccessToken()
    return null
  }

  return rawToken
}

export function getUserFromToken(): DecodedTokenUser | null {
  const token = getAccessToken()
  if (!token) return null

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as DecodedTokenUser
        if (isUserRole(parsed?.roles)) return parsed
        removeAccessToken()
        return null
      }
    } catch {
      // fallback to decoding the valid cookie token below
    }
  }

  const decoded = decodeJwtPayload(token)
  if (decoded && isUserRole(decoded.roles)) return decoded
  return null
}
