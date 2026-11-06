import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import en from './en.json'
import kh from './kh.json'

export type LanguageCode = 'en' | 'kh'

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  en,
  kh,
}

interface I18nContextValue {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>('en')

  useEffect(() => {
    document.documentElement.lang = lang === 'kh' ? 'km' : 'en'
    document.body.classList.remove('inter-tight', 'noto-sans-khmer')
    document.body.classList.add(lang === 'kh' ? 'noto-sans-khmer' : 'inter-tight')
  }, [lang])

  const t = (key: string): string => {
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

