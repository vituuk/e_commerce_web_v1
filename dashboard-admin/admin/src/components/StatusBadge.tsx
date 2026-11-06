import { useI18n } from '@/assets/i18n'

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  return (
    <span className={`status status-${status.toLowerCase().replaceAll(' ', '-')}`}>
      <span className="status-dot" />
      {t(status)}
    </span>
  )
}
