import { useEffect, useRef, useState } from 'react'
import { enFlag, khFlag } from '@/assets/logo'
import { useI18n, type LanguageCode } from '@/assets/i18n'

interface LanguageOption {
  code: LanguageCode
  label: string
  flag: string
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: enFlag },
  { code: 'kh', label: 'Khmer', flag: khFlag },
]

export interface LanguageSwitcherProps {
  onNotify?: (message: string) => void
  onOpen?: () => void
}

export function LanguageSwitcher({ onNotify, onOpen }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useI18n()
  const [langOpen, setLangOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedLang = LANGUAGES.find((item) => item.code === lang) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="lang-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="lang-trigger"
        onClick={() => {
          setLangOpen((prev) => {
            const next = !prev
            if (next) onOpen?.()
            return next
          })
        }}
        aria-expanded={langOpen}
        aria-haspopup="listbox"
      >
        <img src={selectedLang.flag} alt={selectedLang.label} className="lang-flag" />
        <span>{t(selectedLang.label)}</span>
      </button>

      {langOpen && (
        <div className="lang-dropdown" role="listbox" aria-label={t('Languages')}>
          <div className="lang-dropdown-header">{t('Languages')}</div>
          <div className="lang-dropdown-list">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={selectedLang.code === item.code}
                className={`lang-option ${item.code === 'kh' ? 'noto-sans-khmer' : 'inter-tight'} ${selectedLang.code === item.code ? 'active' : ''}`}
                onClick={() => {
                  setLang(item.code)
                  setLangOpen(false)
                  onNotify?.(`Language switched to ${item.label}`)
                }}
              >
                <img src={item.flag} alt={item.label} className="lang-flag" />
                <span>{t(item.label)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher

