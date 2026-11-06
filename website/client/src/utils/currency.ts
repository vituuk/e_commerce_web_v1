export function formatPrice(val: number | string | null | undefined): string {
  const num = Number(val || 0)
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

