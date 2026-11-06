export function format(
  dateInput: Date | string | number | null | undefined,
  pattern = 'MM/dd/yyyy hh:mm a',
): string {
  if (!dateInput) return '—'
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(d.getTime())) return String(dateInput)

  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hours24 = d.getHours()
  const hours12 = hours24 % 12 || 12
  const hh = pad(hours12)
  const HH = pad(hours24)
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  const ampm = hours24 >= 12 ? 'PM' : 'AM'
  const monthsShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const MMM = monthsShort[d.getMonth()]

  return pattern
    .replace('yyyy', yyyy)
    .replace('MMM', MMM)
    .replace('MM', MM)
    .replace('dd', dd)
    .replace('HH', HH)
    .replace('hh', hh)
    .replace('mm', mm)
    .replace('ss', ss)
    .replace(/\ba\b/g, ampm)
}

export function formatDate(dateInput: Date | string | number | null | undefined): string {
  return format(dateInput, 'MMM dd, yyyy')
}

export function formatDateTime(dateInput: Date | string | number | null | undefined): string {
  return format(dateInput, 'MM/dd/yyyy hh:mm a')
}

