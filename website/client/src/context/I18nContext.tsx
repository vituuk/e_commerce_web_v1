import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import en from '@/assets/i18n/en.json'
import kh from '@/assets/i18n/kh.json'

export type LanguageCode = 'en' | 'kh'

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  en,
  kh,
}

export interface I18nContextValue {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: string) => string
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'en'
    try {
      const saved = localStorage.getItem('aura_language')
      return saved === 'kh' || saved === 'km' ? 'kh' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = lang === 'kh' ? 'km' : 'en'
    document.body.classList.remove('inter-tight', 'noto-sans-khmer', 'battambang')
    document.body.classList.add(lang === 'kh' ? 'battambang' : 'inter-tight')
    if (lang === 'kh') {
      document.body.classList.add('noto-sans-khmer')
    }
    try {
      localStorage.setItem('aura_language', lang)
    } catch {}
  }, [lang])

  const t = (key: string): string => {
    if (!key) return ''
    return dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export { en, kh }

