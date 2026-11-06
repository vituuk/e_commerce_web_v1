import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from '@/assets/i18n'

export interface ThemeToggleProps {
  onNotify?: (message: string) => void
}

export function ThemeToggle({ onNotify }: ThemeToggleProps) {
  const { t } = useI18n()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('commerceos-theme') === 'dark' ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.body.classList.toggle('dark-theme', isDark)
    localStorage.setItem('commerceos-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    onNotify?.(nextTheme === 'dark' ? t('Dark mode') : t('Light mode'))
  }

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={theme === 'dark' ? t('Light mode') : t('Dark mode')}
      title={theme === 'dark' ? t('Light mode') : t('Dark mode')}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <Moon /> : <Sun />}
    </button>
  )
}

export default ThemeToggle

