export interface StoreSettings {
  storeName: string
  supportEmail: string
  currency: 'USD ($)' | 'EUR (€)' | 'KHR (៛)'
  taxRate: number
  notificationsEnabled: boolean
  twoFactorEnabled: boolean
}

const SETTINGS_STORAGE_KEY = 'commerceos_store_settings'

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'CommerceOS',
  supportEmail: 'support@commerceos.io',
  currency: 'USD ($)',
  taxRate: 0.08,
  notificationsEnabled: true,
  twoFactorEnabled: false,
}

export function getStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_STORE_SETTINGS
    return { ...DEFAULT_STORE_SETTINGS, ...(JSON.parse(raw) as Partial<StoreSettings>) }
  } catch {
    return DEFAULT_STORE_SETTINGS
  }
}

export function saveStoreSettings(next: Partial<StoreSettings>): StoreSettings {
  const merged = { ...getStoreSettings(), ...next }
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged))
  }
  return merged
}

