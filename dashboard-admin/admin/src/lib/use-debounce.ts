import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay = 500): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      window.clearTimeout(timer)
    }
  }, [value, delay])

  return [debouncedValue, () => setDebouncedValue(value)]
}

export default useDebounce

