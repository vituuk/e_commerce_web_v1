import { useEffect, useRef, useState } from 'react'
import { Lock, LogIn, LogOut, Mail, Settings, User } from 'lucide-react'
import { adminAvatar } from '@/assets/img'
import { useI18n } from '@/assets/i18n'
import { Edit } from '@/components/Edit'
import { Close } from '@/components/Close'
import { Create } from '@/components/Create'
import {
  authApi,
  extractErrorMessage,
  getStoredToken,
  getStoredUser,
  resolveImageUrl,
  setStoredUser,
  type AuthUser,
} from '@/api'
import {
  ADMIN_INTENDED_PATH_KEY,
  ADMIN_LAST_PATH_KEY,
  getUserFromToken,
} from '@/utils'

export interface UserDropdownProps {
  active: string
  onNotify: (message: string) => void
  onSelect?: (label: string) => void
}

export function UserDropdown({ active, onNotify, onSelect }: UserDropdownProps) {
  const { t } = useI18n()
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'profile' | 'setting'>('profile')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    () => getStoredUser() || getUserFromToken(),
  )
  const [customAvatar, setCustomAvatar] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('commerceos_admin_avatar') || '' : '',
  )
  const authRef = useRef<HTMLDivElement>(null)

  const loadAdminProfile = async () => {
    if (!getStoredToken()) return
    try {
      const profData = (await authApi.getMyProfile()) as {
        id?: number
        firstName?: string
        lastName?: string
        email?: string
        profile?: { avatar?: string | null }
        Roles?: Array<{ code: string }>
      } | undefined

      if (profData) {
        if (profData.profile?.avatar) {
          const resolved = resolveImageUrl(profData.profile.avatar)
          setCustomAvatar(resolved)
          if (typeof window !== 'undefined') {
            localStorage.setItem('commerceos_admin_avatar', resolved)
          }
        } else {
          setCustomAvatar('')
          if (typeof window !== 'undefined') {
            localStorage.removeItem('commerceos_admin_avatar')
          }
        }

        const first = (profData.firstName ?? '').trim()
        const last = (profData.lastName ?? '').trim()
        const emailPrefix = profData.email ? profData.email.split('@')[0] : 'Admin'
        const computedFullName = `${first} ${last}`.trim() || first || last || emailPrefix

        const mappedRoles = Array.isArray(profData.Roles)
          ? profData.Roles.map((r) => r.code).filter(Boolean)
          : []
        const fallbackRoles = getStoredUser()?.roles || getUserFromToken()?.roles || ['admin']

        const updated: AuthUser = {
          id: profData.id || 1,
          email: profData.email || '',
          fullName: computedFullName,
          firstName: first,
          lastName: last,
          roles: mappedRoles.length > 0 ? mappedRoles : fallbackRoles,
        }
        setStoredUser(updated)
        setCurrentUser(updated)
      }
    } catch {
      try {
        const u = await authApi.me()
        if (u) setCurrentUser(u)
      } catch {
        setCurrentUser(getStoredUser() || getUserFromToken())
      }
    }
  }

  useEffect(() => {
    const syncProfile = () => {
      const u = getStoredUser() || getUserFromToken()
      if (u) setCurrentUser(u)
      if (typeof window !== 'undefined') {
        setCustomAvatar(localStorage.getItem('commerceos_admin_avatar') || '')
      }
    }
    window.addEventListener('commerceos-profile-updated', syncProfile)
    window.addEventListener('commerceos-auth-change', syncProfile)

    void loadAdminProfile()

    return () => {
      window.removeEventListener('commerceos-profile-updated', syncProfile)
      window.removeEventListener('commerceos-auth-change', syncProfile)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authRef.current && !authRef.current.contains(event.target as Node)) {
        setAuthOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true)
    try {
      const res = await authApi.loginAdmin({ email: loginEmail, password: loginPassword })
      setCurrentUser(res.user)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('commerceos_admin_avatar')
      }
      setCustomAvatar('')
      await loadAdminProfile()
      setLoginModalOpen(false)
      setLoginPassword('')
      window.dispatchEvent(new CustomEvent('commerceos-auth-change'))
      onNotify(`Signed in as ${res.user.fullName || res.user.email}`)
      onSelect?.(active)
    } catch (err) {
      onNotify(
        extractErrorMessage(
          err,
          'Access denied: Only admin or superadmin accounts can sign in',
        ),
      )
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('commerceos_admin_avatar')
      try {
        window.sessionStorage.removeItem(ADMIN_LAST_PATH_KEY)
        window.sessionStorage.removeItem(ADMIN_INTENDED_PATH_KEY)
      } catch {
        // ignore storage errors
      }
    }
    setCustomAvatar('')
    setCurrentUser(null)
    setAuthOpen(false)
    window.dispatchEvent(new CustomEvent('commerceos-auth-change'))
    onNotify(t('Logout'))
  }

  const avatarSrc = customAvatar || adminAvatar
  const first = (currentUser?.firstName ?? '').trim()
  const last = (currentUser?.lastName ?? '').trim()
  const combined = `${first} ${last}`.trim()
  const displayName =
    combined ||
    (currentUser?.firstName !== undefined || currentUser?.lastName !== undefined
      ? (currentUser?.email?.split('@')[0] || 'Admin')
      : (currentUser?.fullName?.trim() || currentUser?.email?.split('@')[0] || 'Admin'))
  const displayRole = currentUser?.roles?.includes('superadmin')
    ? 'Superadmin'
    : currentUser?.roles?.includes('admin')
      ? t('Admin')
      : currentUser?.roles?.length
        ? currentUser.roles.join(', ')
        : t('Admin')

  return (
    <>
      {loginModalOpen && (
        <div
          className="crud-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLoginModalOpen(false)
          }}
        >
          <section
            className="crud-dialog"
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '420px', width: '100%' }}
          >
            <div className="crud-dialog-header">
              <div className="crud-header-main">
                <div>
                  <h2 style={{ margin: 0 }}>Admin API Sign In</h2>
                  <p className="crud-header-sub">
                    Authenticate with <code>POST /auth/admin/login</code>
                  </p>
                </div>
              </div>
              <Close variant="icon" onClick={() => setLoginModalOpen(false)} />
            </div>
            <form
              onSubmit={(e) => void handleLoginSubmit(e)}
              style={{
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <label className="crud-field">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail style={{ width: 13 }} /> {t('Email')}
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </label>
              <label className="crud-field">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock style={{ width: 13 }} /> {t('Password')}
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <Close onClick={() => setLoginModalOpen(false)} />
                <Create
                  type="submit"
                  icon="none"
                  disabled={loggingIn}
                  label={loggingIn ? 'Signing in...' : 'Sign In'}
                />
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="auth-switcher" ref={authRef}>
        <button
          type="button"
          className={`auth-trigger ${authOpen ? 'active' : ''}`}
          onClick={() => setAuthOpen((prev) => !prev)}
          aria-expanded={authOpen}
          aria-haspopup="menu"
        >
          <div className="auth-user-text">
          
            <span className="auth-role">{displayRole}</span>
          </div>
          <img
            src={avatarSrc}
            alt={displayName}
            className="auth-avatar-img"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = adminAvatar
            }}
          />
        </button>

        {authOpen && (
          <div className="auth-dropdown" role="menu">
            <div className="auth-dropdown-header">
              <img
                src={avatarSrc}
                alt={displayName}
                className="auth-dropdown-avatar"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = adminAvatar
                }}
              />
              <div className="auth-dropdown-meta">
                <strong>{displayName}</strong>
                <span>{currentUser?.email || displayRole}</span>
              </div>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authTab === 'profile' ? 'active' : ''}`}
                onClick={() => setAuthTab('profile')}
              >
                <User />
                <span>{t('Profile')}</span>
              </button>
              <button
                type="button"
                className={`auth-tab ${authTab === 'setting' ? 'active' : ''}`}
                onClick={() => setAuthTab('setting')}
              >
                <Settings />
                <span>{t('Setting')}</span>
              </button>
            </div>

            {authTab === 'profile' && (
              <div className="auth-dropdown-list">
                <button
                  type="button"
                  className="auth-menu-item"
                  onClick={() => {
                    setAuthOpen(false)
                    setLoginModalOpen(true)
                  }}
                >
                  <LogIn />
                  <span>{currentUser ? 'Switch Admin Account' : 'Sign In to Admin API'}</span>
                </button>
                <Edit
                  variant="menu"
                  label="Edit Profile"
                  className="auth-menu-item"
                  onClick={() => {
                    setAuthOpen(false)
                    onSelect?.('Edit Profile')
                  }}
                />
                <button type="button" className="auth-menu-item" onClick={handleLogout}>
                  <LogOut style={{ transform: 'scaleX(-1)' }} />
                  <span>{t('Logout')}</span>
                </button>
              </div>
            )}
            {authTab === 'setting' && (
              <div className="auth-dropdown-list">
                <button
                  type="button"
                  className="auth-menu-item"
                  onClick={() => {
                    setAuthOpen(false)
                    onSelect?.('Settings')
                  }}
                >
                  <Settings />
                  <span>Store Settings</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default UserDropdown
