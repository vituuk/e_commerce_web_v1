import { RefreshCw } from 'lucide-react'

export interface SpinnerProps {
  label?: string
  size?: number
}

export function Spinner({ label, size = 16 }: SpinnerProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <RefreshCw
        style={{
          width: `${size}px`,
          height: `${size}px`,
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && <span>{label}</span>}
    </span>
  )
}

export default Spinner

