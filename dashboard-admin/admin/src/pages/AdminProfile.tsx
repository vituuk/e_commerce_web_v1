import { useEffect, useRef, useState } from 'react'
import {
  Calendar,
  Camera,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { adminAvatar } from '@/assets/img'
import { useI18n } from '@/assets/i18n'
import { Cancel } from '@/components/Cancel'
import { Edit } from '@/components/Edit'
import {
  authApi,
  extractErrorMessage,
  getStoredUser,
  resolveImageUrl,
  setStoredUser,
} from '@/api'

interface ProfileData {
  id: number
  firstName?: string
  lastName?: string
  email: string
  status?: boolean
  Roles?: Array<{ code: string; name: string }>
  profile?: {
    id?: number
    avatar?: string | null
    bio?: string | null
    phone?: string | null
    date_of_birth?: string | null
    createdAt?: string
    updatedAt?: string
  } | null
}

function toDateInputValue(raw?: string | null): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    return raw.slice(0, 10)
  }
  return d.toISOString().slice(0, 10)
}

export interface AdminProfileProps {
  notify: (message: string) => void
  onSelect?: (label: string) => void
}

export function AdminProfile({ notify, onSelect }: AdminProfileProps) {
  const { t } = useI18n()
  const storedUser = getStoredUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)

  const [userId, setUserId] = useState<number>(storedUser?.id || 1)
  const [firstName, setFirstName] = useState(
    storedUser?.firstName || storedUser?.fullName?.split(' ')[0] || '',
  )
  const [lastName, setLastName] = useState(
    storedUser?.lastName || storedUser?.fullName?.split(' ').slice(1).join(' ') || '',
  )
  const [email, setEmail] = useState(storedUser?.email || '')
  const [roles, setRoles] = useState<string[]>(storedUser?.roles || ['admin'])
  const [status, setStatus] = useState(true)

  const [avatar, setAvatar] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [bio, setBio] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const applyProfileData = (data: ProfileData) => {
    setUserId(data.id)
    setFirstName(data.firstName || '')
    setLastName(data.lastName || '')
    setEmail(data.email || '')
    setStatus(data.status !== false)
    if (Array.isArray(data.Roles) && data.Roles.length > 0) {
      setRoles(data.Roles.map((r) => r.code))
    }
    const prof = data.profile
    setHasExistingProfile(Boolean(prof))
    setAvatar(prof?.avatar || '')
    setPhone(prof?.phone != null ? String(prof.phone) : '')
    setDateOfBirth(toDateInputValue(prof?.date_of_birth))
    setBio(prof?.bio || '')
    setUpdatedAt(prof?.updatedAt || null)
  }

  const fetchMyProfile = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = (await authApi.getMyProfile()) as ProfileData | undefined
      if (data) {
        applyProfileData(data)
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Could not load admin profile'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMyProfile()
  }, [])

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setErrorMessage('')
    try {
      const uploadedUrl = await authApi.uploadAvatar(file)
      if (uploadedUrl) {
        setAvatar(uploadedUrl)
        notify('Avatar image uploaded — click Save changes to apply')
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Avatar upload failed'))
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSaving(true)
    setErrorMessage('')
    try {
      const cleanPhone = String(phone ?? '').trim()
      const digitsOnly = cleanPhone.replace(/[\s()\-.]/g, '')
      if (digitsOnly && !/^\+?[0-9]{6,15}$/.test(digitsOnly)) {
        throw new Error('Phone must be 6–15 digits (optional leading +)')
      }

      const cleanFirst = String(firstName ?? '').trim()
      const cleanLast = String(lastName ?? '').trim()
      const cleanAvatar = String(avatar ?? '').trim()
      const cleanDob = String(dateOfBirth ?? '').trim()
      const cleanBio = String(bio ?? '').trim()

      const payload = {
        firstName: cleanFirst,
        lastName: cleanLast,
        avatar: cleanAvatar,
        phone: digitsOnly,
        date_of_birth: cleanDob,
        bio: cleanBio,
      }

      const updated = (await authApi.saveMyProfile(
        payload,
        hasExistingProfile,
      )) as ProfileData | undefined

      if (updated) {
        applyProfileData(updated)
      } else {
        setHasExistingProfile(true)
      }

      const fullName = `${cleanFirst} ${cleanLast}`.trim() || cleanFirst || cleanLast || email
      const current = getStoredUser()
      setStoredUser({
        id: updated?.id || current?.id || userId,
        email: updated?.email || current?.email || email,
        fullName,
        firstName: cleanFirst,
        lastName: cleanLast,
        roles:
          updated?.Roles?.map((r) => r.code) ||
          current?.roles ||
          roles,
      })

      if (typeof window !== 'undefined') {
        if (cleanAvatar) {
          localStorage.setItem('commerceos_admin_avatar', resolveImageUrl(cleanAvatar))
        } else {
          localStorage.removeItem('commerceos_admin_avatar')
        }
        window.dispatchEvent(new CustomEvent('commerceos-profile-updated'))
      }

      notify('Admin profile saved successfully')

      if (onSelect) {
        setTimeout(() => {
          onSelect('Dashboard')
        }, 500)
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to update admin profile')
      setErrorMessage(msg)
      notify(msg)
    } finally {
      setSaving(false)
    }
  }

  const resolvedAvatar = avatar.trim() ? resolveImageUrl(avatar.trim()) : adminAvatar
  const fullNameDisplay = `${firstName} ${lastName}`.trim() || email.split('@')[0] || 'Admin'
  const primaryRoleLabel = roles.includes('superadmin') ? 'Superadmin' : 'Admin'

  return (
    <div className="feature-view">
      <div className="feature-heading">
        <div>
          <h1>{t('Edit Profile')}</h1>
          <p className="subheading" style={{ margin: '4px 0 0' }}>
            Manage your personal admin account details and profile information
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cancel
            label="Cancel"
            onClick={() => onSelect?.('Dashboard')}
          />
          <Cancel
            label="Reset"
            onClick={() => {
              void fetchMyProfile()
              notify('Profile reset to saved values')
            }}
          />
          <Edit
            label={saving ? 'Saving...' : 'Save changes'}
            className="primary-button"
            disabled={saving || loading}
            onClick={() => void handleSave()}
          />
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) minmax(340px, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Card: Admin Identity & Avatar */}
        <section className="panel" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
            }}
          >
            <div style={{ position: 'relative', width: '96px', height: '96px' }}>
              <img
                src={resolvedAvatar}
                alt={fullNameDisplay}
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = adminAvatar
                }}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Upload new avatar"
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  background: '#247f75',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.18)',
                }}
              >
                <Camera style={{ width: '15px', height: '15px' }} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={(e) => void handleAvatarFileChange(e)}
              />
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                {fullNameDisplay}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{email}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              <span
                className="status-badge active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Shield style={{ width: '12px', height: '12px' }} />
                {primaryRoleLabel}
              </span>
              <span className={`status-badge ${status ? 'active' : 'inactive'}`}>
                <CheckCircle2 style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                {status ? 'Active Account' : 'Inactive'}
              </span>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: '20px',
              paddingTop: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="filter-button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Camera style={{ width: '14px', height: '14px' }} />
                <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
              </button>
              {avatar && (
                <button
                  type="button"
                  className="filter-button"
                  onClick={() => setAvatar('')}
                  title="Remove custom avatar"
                  style={{ color: '#dc2626' }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>

            <label className="crud-field">
              <span>Avatar URL</span>
              <input
                type="text"
                placeholder="https://example.com/avatar.png"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </label>

            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '10px',
              }}
            >
              <div>
                <strong>Admin ID:</strong> #{userId}
              </div>
              <div>
                <strong>Assigned Roles:</strong> {roles.join(', ')}
              </div>
              {updatedAt && (
                <div>
                  <strong>Last Updated:</strong> {new Date(updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Card: Admin Profile Details Form */}
        <section className="panel" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="product-avatar">
                <UserIcon />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px' }}>Personal Information</h2>
                <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '11px' }}>
                  Connected to <code>GET / PUT /auth/profile</code>
                </p>
              </div>
            </div>
            {loading && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw style={{ width: '13px', height: '13px' }} /> Loading...
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => void handleSave(e)}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
              }}
            >
              <label className="crud-field">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserIcon style={{ width: '13px' }} /> First Name
                </span>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>

              <label className="crud-field">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserIcon style={{ width: '13px' }} /> Last Name
                </span>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
              }}
            >
              <label className="crud-field">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail style={{ width: '13px' }} /> {t('Email')} (Account Login)
                </span>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                />
              </label>

              <label className="crud-field">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone style={{ width: '13px' }} /> Phone Number
                </span>
                <input
                  type="tel"
                  placeholder="+85512345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>

            <label className="crud-field" style={{ maxWidth: '320px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar style={{ width: '13px' }} /> Date of Birth
              </span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </label>

            <label className="crud-field">
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '13px' }} /> Bio / About Admin
                </span>
                <small style={{ color: '#94a3b8', fontWeight: 400 }}>{bio.length}/2000</small>
              </span>
              <textarea
                rows={4}
                maxLength={2000}
                placeholder="Write a short bio or role description..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <Cancel
                label="Cancel"
                onClick={() => onSelect?.('Dashboard')}
              />
              <Cancel
                label="Reset"
                onClick={() => {
                  void fetchMyProfile()
                }}
              />
              <Edit
                type="submit"
                label={saving ? 'Saving...' : 'Save changes'}
                className="primary-button"
                disabled={saving || loading}
              />
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default AdminProfile

