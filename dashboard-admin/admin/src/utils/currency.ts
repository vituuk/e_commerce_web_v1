const DEFAULT_KHR_RATE = 4100

export function formatUsd(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0)
  const safe = Number.isFinite(num) ? num : 0
  return `$${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatKhr(
  amountUsd: number | string | null | undefined,
  rate = DEFAULT_KHR_RATE,
): string {
  const num = Number(amountUsd ?? 0)
  const safe = Number.isFinite(num) ? Math.round(num * rate) : 0
  return `${safe.toLocaleString('en-US')} ៛`
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: 'USD' | 'KHR' | 'EUR' = 'USD',
): string {
  if (currency === 'KHR') return formatKhr(amount)
  const num = Number(amount ?? 0)
  const safe = Number.isFinite(num) ? num : 0
  const symbol = currency === 'EUR' ? '€' : '$'
  return `${symbol}${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

