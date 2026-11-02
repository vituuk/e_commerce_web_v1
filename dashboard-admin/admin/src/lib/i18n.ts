import { en, kh, I18nProvider, useI18n, type LanguageCode } from '@/assets/i18n'

export const i18nConfig = {
  fallbackLng: 'en' as LanguageCode,
  supportedLngs: ['en', 'kh'] as LanguageCode[],
  resources: {
    en: { translation: en },
    kh: { translation: kh },
  },
}

export { I18nProvider, useI18n, en, kh }
export type { LanguageCode }
export default i18nConfig

