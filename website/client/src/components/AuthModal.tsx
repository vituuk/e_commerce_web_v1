import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import googleLogo from '@/assets/logo/google.png'
import { eyesIcon } from '@/assets/img'
import { extractErrorMessage } from '@/api/client'
import { useI18n } from '@/assets/i18n'
import {
  authGoogleLogin,
  authUserLogin,
  authUserRegister,
  getAuthMe,
  getGoogleAuthClientId,
} from '@/services/auth.service'
import {
  ensureGoogleGsiLoaded,
  isConfiguredGoogleClientId,
  validateGoogleClientId,
} from '@/utils/googleAuth'
import { getUserFromToken } from '@/utils/tokenStorage'
import type { AuthUser } from '@/types/auth'
import type { ToastType } from '@/types/navigation'

export interface AuthModalProps {
  initialMode?: 'login' | 'register'
  onClose: () => void
  onSuccess: (user: AuthUser | null, token?: string) => void
  showToast: (message: string, type?: ToastType) => void
}

export function AuthModal({
  initialMode = 'login',
  onClose,
  onSuccess,
  showToast,
}: AuthModalProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    const raw = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || ''
    return isConfiguredGoogleClientId(raw) ? raw : ''
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlockedFields, setUnlockedFields] = useState({
    email: false,
    password: false,
    firstName: false,
    lastName: false,
  })
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  // Ensure inputs are always clean and cleared whenever mode changes or modal mounts
  useEffect(() => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    })
    setUnlockedFields({
      email: false,
      password: false,
      firstName: false,
      lastName: false,
    })
    setShowPassword(false)
    setErrorMsg('')

    // Defeat any delayed browser autofill injection attempts
    const timer = setTimeout(() => {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
      })
    }, 70)
    return () => clearTimeout(timer)
  }, [mode])

  useEffect(() => {
    let cancelled = false
    void ensureGoogleGsiLoaded().catch(() => {
      // handled on click if script was blocked
    })
    if (!googleClientId) {
      void getGoogleAuthClientId().then((id) => {
        if (!cancelled && id) {
          setGoogleClientId(id)
        }
      })
    }
    return () => {
      cancelled = true
    }
  }, [googleClientId])

  const openGoogleOAuthPopup = (clientId: string) => {
    const oauth2 = window.google?.accounts?.oauth2
    if (!oauth2?.initTokenClient) {
      throw new Error('Google Sign-In is still loading. Please try clicking again in a moment.')
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          setGoogleLoading(false)
          if (tokenResponse.error !== 'access_denied') {
            const msg =
              tokenResponse.error_description || 'Google Sign-In failed. Please try again.'
            setErrorMsg(msg)
            showToast(msg, 'error')
          }
          return
        }

        const accessToken = tokenResponse.access_token
        if (!accessToken) {
          setGoogleLoading(false)
          const msg = 'Did not receive authorization token from Google.'
          setErrorMsg(msg)
          showToast(msg, 'error')
          return
        }

        void (async () => {
          setLoading(true)
          try {
            const loginData = await authGoogleLogin({ accessToken })
            const token = loginData?.token
            if (token) {
              const meUser = (await getAuthMe()) || loginData.user || getUserFromToken()
              onSuccess(meUser, token)
              showToast('Signed in with Google successfully!', 'success')
              handleClose()
            }
          } catch (err: unknown) {
            const msg = extractErrorMessage(err, 'Google authentication failed')
            setErrorMsg(msg)
            showToast(msg, 'error')
          } finally {
            setLoading(false)
            setGoogleLoading(false)
          }
        })()
      },
      error_callback: (err) => {
        setGoogleLoading(false)
        if (err?.type && err.type !== 'popup_closed') {
          const msg =
            err.type === 'popup_failed_to_open'
              ? 'Google Sign-In popup was blocked by your browser. Please allow popups for this site.'
              : 'Google Sign-In was interrupted. Please try again.'
          setErrorMsg(msg)
          showToast(msg, 'error')
        }
      },
    })

    tokenClient.requestAccessToken({ prompt: 'select_account' })
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setGoogleLoading(true)

    try {
      // Fast synchronous path when clientId & Google SDK are already preloaded (avoids popup blockers)
      if (googleClientId && window.google?.accounts?.oauth2?.initTokenClient) {
        openGoogleOAuthPopup(googleClientId)
        return
      }

      const [resolvedId] = await Promise.all([
        googleClientId ? Promise.resolve(googleClientId) : getGoogleAuthClientId(),
        ensureGoogleGsiLoaded(),
      ])

      if (!resolvedId) {
        setGoogleLoading(false)
        const rawEnv = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || ''
        const check = validateGoogleClientId(rawEnv)
        const msg =
          check.reason ||
          'Google Client ID is not configured yet. Please add GOOGLE_CLIENT_ID in admin/.env and VITE_GOOGLE_CLIENT_ID in website/client/.env.'
        setErrorMsg(msg)
        showToast(msg, 'error')
        return
      }

      if (resolvedId !== googleClientId) {
        setGoogleClientId(resolvedId)
      }

      openGoogleOAuthPopup(resolvedId)
    } catch (err: unknown) {
      setGoogleLoading(false)
      const msg = extractErrorMessage(err, 'Unable to start Google Sign-In')
      setErrorMsg(msg)
      showToast(msg, 'error')
    }
  }

  const handleClose = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    })
    setUnlockedFields({
      email: false,
      password: false,
      firstName: false,
      lastName: false,
    })
    setShowPassword(false)
    setErrorMsg('')
    setSuccessMsg('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      if (mode === 'register') {
        await authUserRegister({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        })
        setSuccessMsg('Account created successfully! Please sign in with your email and password.')
        showToast('Account created successfully! Please sign in.', 'success')
        setMode('login')
        setForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        })
        return
      }

      const loginData = await authUserLogin({
        email: form.email.trim(),
        password: form.password,
      })

      const token = loginData?.token
      if (token) {
        const meUser = (await getAuthMe()) || getUserFromToken()
        onSuccess(meUser, token)
        showToast('Signed in successfully!', 'success')
        handleClose()
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Authentication failed')
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ug-modal-backdrop" onClick={handleClose}>
      <div className="ug-small-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ug-modal-close" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="ug-auth-header">
          <h3>{mode === 'login' ? t('Sign In to Your Account') : t('Create Your Account')}</h3>
        </div>

        {successMsg && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              lineHeight: 1.45,
              marginBottom: '14px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '12.5px',
              lineHeight: 1.45,
              marginBottom: '14px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="ug-auth-form" onSubmit={handleSubmit} autoComplete="off">
          {/* Chrome autofill blocker trap fields */}
          <div
            style={{
              position: 'absolute',
              top: '-9999px',
              left: '-9999px',
              opacity: 0,
              width: 0,
              height: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <input type="text" name="chrome_fake_user_trap" tabIndex={-1} autoComplete="off" />
            <input type="password" name="chrome_fake_pass_trap" tabIndex={-1} autoComplete="new-password" />
          </div>

          {mode === 'register' && (
            <div className="ug-form-row-2">
              <div className="ug-form-group">
                <label>{t('First Name')}</label>
                <div className="ug-input-wrap">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="auth_reg_first_name"
                    placeholder={t('Enter your first name')}
                    readOnly={!unlockedFields.firstName}
                    onFocus={() => setUnlockedFields((p) => ({ ...p, firstName: true }))}
                    onClick={() => setUnlockedFields((p) => ({ ...p, firstName: true }))}
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                  {form.firstName && (
                    <button
                      type="button"
                      className="ug-input-clear-btn"
                      onClick={() => setForm((prev) => ({ ...prev, firstName: '' }))}
                      title="Clear first name"
                      aria-label="Clear first name"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="ug-form-group">
                <label>{t('Last Name')}</label>
                <div className="ug-input-wrap">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="auth_reg_last_name"
                    placeholder={t('Enter your last name')}
                    readOnly={!unlockedFields.lastName}
                    onFocus={() => setUnlockedFields((p) => ({ ...p, lastName: true }))}
                    onClick={() => setUnlockedFields((p) => ({ ...p, lastName: true }))}
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                  {form.lastName && (
                    <button
                      type="button"
                      className="ug-input-clear-btn"
                      onClick={() => setForm((prev) => ({ ...prev, lastName: '' }))}
                      title="Clear last name"
                      aria-label="Clear last name"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="ug-form-group">
            <label>{t('E-mail')}</label>
            <div className="ug-input-wrap">
              <input
                type="text"
                inputMode="email"
                required
                autoComplete="off"
                name="auth_reg_email"
                placeholder={t('Enter your email')}
                readOnly={!unlockedFields.email}
                onFocus={() => setUnlockedFields((p) => ({ ...p, email: true }))}
                onClick={() => setUnlockedFields((p) => ({ ...p, email: true }))}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {form.email && (
                <button
                  type="button"
                  className="ug-input-clear-btn"
                  onClick={() => setForm((prev) => ({ ...prev, email: '' }))}
                  title="Clear email"
                  aria-label="Clear email"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="ug-form-group">
            <label>{t('Password')}</label>
            <div className="ug-input-wrap has-eye-btn">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                name={mode === 'register' ? 'auth_reg_password' : 'auth_login_password'}
                placeholder={
                  mode === 'register'
                    ? t('Create a password (min. 6 characters)')
                    : t('Enter your password')
                }
                readOnly={!unlockedFields.password}
                onFocus={() => setUnlockedFields((p) => ({ ...p, password: true }))}
                onClick={() => setUnlockedFields((p) => ({ ...p, password: true }))}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {form.password && (
                <button
                  type="button"
                  className="ug-input-clear-btn ug-input-clear-btn-pw"
                  onClick={() => setForm((prev) => ({ ...prev, password: '' }))}
                  title="Clear password"
                  aria-label="Clear password"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                className={`ug-input-eye-btn ${showPassword ? 'is-active' : ''}`}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? t('Hide password') : t('Show password')}
                aria-label={showPassword ? t('Hide password') : t('Show password')}
                tabIndex={-1}
              >
                <img
                  src={eyesIcon}
                  alt="Toggle password visibility"
                  className="ug-password-eye-icon"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="ug-primary-btn ug-full-btn"
            disabled={loading || googleLoading}
          >
            {loading
              ? '...'
              : mode === 'login'
              ? t('Sign In')
              : t('Create Account')}
          </button>

          {/* Divider between form and Google login */}
          <div className="ug-auth-divider">
            <span>OR</span>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            className="ug-google-btn"
            disabled={loading || googleLoading}
            onClick={() => void handleGoogleSignIn()}
          >
            <img
              src={googleLogo}
              alt="Google"
              className="ug-google-icon"
              onError={(e) => {
                e.currentTarget.src = '/src/assets/logo/google.png'
              }}
            />
            <span>
              {googleLoading
                ? 'Connecting to Google...'
                : mode === 'login'
                ? t('Log in with Google')
                : t('Sign up with Google')}
            </span>
          </button>

          {/* Bottom switch link instead of top tabs */}
          <div className="ug-auth-switch-text">
            {mode === 'login' ? (
              <>
                {t("Don't have an account? Sign up")}{' '}
                <button
                  type="button"
                  className="ug-auth-switch-link"
                  onClick={() => {
                    setErrorMsg('')
                    setSuccessMsg('')
                    setMode('register')
                  }}
                >
                  {t('Register')}
                </button>
              </>
            ) : (
              <>
                {t("Already have an account? Sign in")}{' '}
                <button
                  type="button"
                  className="ug-auth-switch-link"
                  onClick={() => {
                    setErrorMsg('')
                    setSuccessMsg('')
                    setMode('login')
                  }}
                >
                  {t('Sign In')}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
