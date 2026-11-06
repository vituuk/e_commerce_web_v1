export interface GoogleTokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
  error_uri?: string
}

export interface GoogleTokenError {
  type?: 'popup_closed' | 'popup_failed_to_open' | 'unknown' | string
  message?: string
}

export interface GoogleTokenClientConfig {
  client_id: string
  scope: string
  prompt?: string
  callback: (response: GoogleTokenResponse) => void
  error_callback?: (error: GoogleTokenError) => void
}

export interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient
        }
      }
    }
  }
}

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client'

export function validateGoogleClientId(value?: string | null): {
  valid: boolean
  reason?: string
} {
  if (!value || !value.trim()) {
    return {
      valid: false,
      reason:
        'Google Client ID is empty. Please set VITE_GOOGLE_CLIENT_ID in website/client/.env and GOOGLE_CLIENT_ID in admin/.env.',
    }
  }
  const trimmed = value.trim()
  if (
    trimmed.startsWith('your-google-client-id') ||
    trimmed.startsWith('YOUR_GOOGLE_CLIENT_ID')
  ) {
    return {
      valid: false,
      reason:
        'Please replace the placeholder Google Client ID with your real Client ID ending in .apps.googleusercontent.com.',
    }
  }
  if (trimmed.startsWith('GOCSPX-')) {
    return {
      valid: false,
      reason:
        'You pasted the Google Client Secret (starts with GOCSPX-) instead of the Client ID! Please copy the "Client ID" (which ends with .apps.googleusercontent.com) from Google Cloud Console → Credentials.',
    }
  }
  if (!trimmed.endsWith('.apps.googleusercontent.com')) {
    return {
      valid: false,
      reason:
        'Invalid Google Client ID format. A valid Google Client ID must end with .apps.googleusercontent.com.',
    }
  }
  return { valid: true }
}

export function isConfiguredGoogleClientId(value?: string | null): boolean {
  return validateGoogleClientId(value).valid
}

let loadingPromise: Promise<void> | null = null

export function ensureGoogleGsiLoaded(timeoutMs = 10000): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In is only available in the browser'))
  }
  if (window.google?.accounts?.oauth2?.initTokenClient) {
    return Promise.resolve()
  }
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise<void>((resolve, reject) => {
    const startTime = Date.now()

    const checkAlreadyLoaded = () => {
      if (window.google?.accounts?.oauth2?.initTokenClient) {
        resolve()
        return true
      }
      return false
    }

    if (checkAlreadyLoaded()) return

    let existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_GSI_SRC}"]`,
    )

    const cleanup = () => {
      loadingPromise = null
    }

    const pollInterval = window.setInterval(() => {
      if (checkAlreadyLoaded()) {
        window.clearInterval(pollInterval)
      } else if (Date.now() - startTime >= timeoutMs) {
        window.clearInterval(pollInterval)
        cleanup()
        reject(
          new Error(
            'Could not load Google Sign-In script. Please check your internet connection and try again.',
          ),
        )
      }
    }, 100)

    if (!existingScript) {
      existingScript = document.createElement('script')
      existingScript.src = GOOGLE_GSI_SRC
      existingScript.async = true
      existingScript.defer = true
      existingScript.onload = () => {
        if (checkAlreadyLoaded()) {
          window.clearInterval(pollInterval)
        }
      }
      existingScript.onerror = () => {
        window.clearInterval(pollInterval)
        cleanup()
        reject(
          new Error(
            'Failed to load Google Sign-In script from accounts.google.com.',
          ),
        )
      }
      document.head.appendChild(existingScript)
    }
  })

  return loadingPromise
}

