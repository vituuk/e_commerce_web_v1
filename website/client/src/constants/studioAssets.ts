import { NO_IMAGE_PLACEHOLDER } from '@/utils/productImage'

export function getFallbackProductImage(_index: number | string = 0): string {
  return NO_IMAGE_PLACEHOLDER
}

export function getColorHex(colorName?: string | null): string {
  if (!colorName) return '#71717a'
  const c = String(colorName).trim().toLowerCase()
  if (c.startsWith('#')) return c
  const map: Record<string, string> = {
    black: '#18181b',
    white: '#f8fafc',
    bone: '#f4efe6',
    cream: '#f3efe6',
    ivory: '#f8f5ee',
    grey: '#71717a',
    gray: '#71717a',
    'heather grey': '#8c8f94',
    charcoal: '#3f3f46',
    silver: '#cbd5e1',
    navy: '#1e3a8a',
    blue: '#2563eb',
    'washed indigo': '#284b63',
    indigo: '#3730a3',
    sky: '#0ea5e9',
    red: '#dc2626',
    port: '#6e352c',
    burgundy: '#7f1d1d',
    maroon: '#7f1d1d',
    pink: '#ec4899',
    rose: '#f43f5e',
    green: '#15803d',
    'deep forest': '#1d382d',
    forest: '#14532d',
    olive: '#3f5232',
    sage: '#84a98c',
    emerald: '#059669',
    yellow: '#eab308',
    gold: '#ca8a04',
    mustard: '#d97706',
    orange: '#ea580c',
    brown: '#78350f',
    tan: '#b45309',
    beige: '#d6ccc2',
    sand: '#e3d5ca',
    khaki: '#a39171',
    taupe: '#8b837b',
    purple: '#7c3aed',
    lavender: '#a78bfa',
    titanium: '#64748b',
  }
  for (const [key, hex] of Object.entries(map)) {
    if (c === key || c.includes(key)) return hex
  }
  return '#64748b'
}
