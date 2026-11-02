import React from 'react'

export interface TeeColorPaletteItem {
  name: string
  hex: string
  shadow: string
  highlight: string
  light: boolean
  heather?: boolean
}

export const UGMONK_PALETTE: TeeColorPaletteItem[] = [
  { name: 'Port', hex: '#6e352c', shadow: '#4f231c', highlight: '#824339', light: false },
  { name: 'Deep Forest', hex: '#1d382d', shadow: '#11241c', highlight: '#294b3d', light: false },
  { name: 'Bone', hex: '#f4efe6', shadow: '#dcd4c6', highlight: '#ffffff', light: true },
  { name: 'Charcoal', hex: '#545559', shadow: '#3b3c40', highlight: '#68696e', light: false },
  { name: 'Washed Indigo', hex: '#284b63', shadow: '#1a3447', highlight: '#365f7a', light: false },
  { name: 'Black', hex: '#1e1e20', shadow: '#101012', highlight: '#2f2f33', light: false },
  {
    name: 'Heather Grey',
    hex: '#8c8f94',
    shadow: '#6d7075',
    highlight: '#a3a6ab',
    light: false,
    heather: true,
  },
  { name: 'Olive', hex: '#3f5232', shadow: '#2b3921', highlight: '#506641', light: false },
]

export function resolveTeeColor(
  colorName?: string | null,
  fallbackIndex = 0,
): TeeColorPaletteItem {
  if (colorName) {
    const normalized = String(colorName).trim().toLowerCase()
    const match = UGMONK_PALETTE.find(
      (p) => p.name.toLowerCase() === normalized || normalized.includes(p.name.toLowerCase()),
    )
    if (match) return match

    const map: Record<string, TeeColorPaletteItem> = {
      red: { name: colorName, hex: '#7a2e28', shadow: '#541d19', highlight: '#913b34', light: false },
      burgundy: { name: colorName, hex: '#6e352c', shadow: '#4f231c', highlight: '#824339', light: false },
      maroon: { name: colorName, hex: '#6e352c', shadow: '#4f231c', highlight: '#824339', light: false },
      green: { name: colorName, hex: '#1d382d', shadow: '#11241c', highlight: '#294b3d', light: false },
      forest: { name: colorName, hex: '#1d382d', shadow: '#11241c', highlight: '#294b3d', light: false },
      olive: { name: colorName, hex: '#3f5232', shadow: '#2b3921', highlight: '#506641', light: false },
      white: { name: colorName, hex: '#f4efe6', shadow: '#dcd4c6', highlight: '#ffffff', light: true },
      cream: { name: colorName, hex: '#f4efe6', shadow: '#dcd4c6', highlight: '#ffffff', light: true },
      ivory: { name: colorName, hex: '#f4efe6', shadow: '#dcd4c6', highlight: '#ffffff', light: true },
      grey: { name: colorName, hex: '#8c8f94', shadow: '#6d7075', highlight: '#a3a6ab', light: false },
      gray: { name: colorName, hex: '#8c8f94', shadow: '#6d7075', highlight: '#a3a6ab', light: false },
      charcoal: { name: colorName, hex: '#545559', shadow: '#3b3c40', highlight: '#68696e', light: false },
      blue: { name: colorName, hex: '#284b63', shadow: '#1a3447', highlight: '#365f7a', light: false },
      navy: { name: colorName, hex: '#1d2d44', shadow: '#111c2b', highlight: '#2b405e', light: false },
      indigo: { name: colorName, hex: '#284b63', shadow: '#1a3447', highlight: '#365f7a', light: false },
      black: { name: colorName, hex: '#1e1e20', shadow: '#101012', highlight: '#2f2f33', light: false },
      brown: { name: colorName, hex: '#5c4033', shadow: '#3d2920', highlight: '#735243', light: false },
      sand: { name: colorName, hex: '#d8cbb8', shadow: '#bfb09b', highlight: '#e6dccb', light: true },
      beige: { name: colorName, hex: '#d8cbb8', shadow: '#bfb09b', highlight: '#e6dccb', light: true },
    }

    for (const [key, val] of Object.entries(map)) {
      if (normalized.includes(key)) return val
    }

    if (normalized.startsWith('#') && (normalized.length === 4 || normalized.length === 7)) {
      return {
        name: colorName,
        hex: normalized,
        shadow: '#222222',
        highlight: normalized,
        light: normalized.toLowerCase() === '#fff' || normalized.toLowerCase() === '#ffffff',
      }
    }
  }
  return UGMONK_PALETTE[Math.abs(fallbackIndex) % UGMONK_PALETTE.length]
}

export interface StudioTeeCardGraphicProps {
  colorName?: string
  index?: number
  showGraphic?: boolean
}

/**
 * Renders the flat-lay minimalist t-shirt inside a light grey square card,
 * matching the Men's Essential Tee 4x2 grid.
 */
export function StudioTeeCardGraphic({
  colorName,
  index = 0,
  showGraphic = false,
}: StudioTeeCardGraphicProps) {
  const palette = resolveTeeColor(colorName, index)
  const gradId = `tee-grad-${index}-${palette.name.replace(/\s+/g, '')}`
  const shadowId = `tee-shadow-${index}-${palette.name.replace(/\s+/g, '')}`

  return (
    <svg
      viewBox="0 0 400 430"
      className="ug-tee-svg"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={palette.name}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.highlight} />
          <stop offset="50%" stopColor={palette.hex} />
          <stop offset="100%" stopColor={palette.shadow} />
        </linearGradient>
        <filter id={shadowId} x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* Main T-Shirt Flat-Lay Silhouette */}
      <g filter={`url(#${shadowId})`}>
        {/* Back neck interior */}
        <path
          d="M158 72 Q200 88 242 72 L242 92 Q200 104 158 92 Z"
          fill={palette.shadow}
        />

        {/* Woven neck label */}
        <rect
          x="190"
          y="80"
          width="20"
          height="9"
          rx="1"
          fill="#f2eadc"
          opacity="0.92"
        />
        <line x1="193" y1="84.5" x2="207" y2="84.5" stroke="#7a7267" strokeWidth="1.2" />

        {/* Shirt body + sleeves */}
        <path
          d="
            M 156 70
            Q 200 96 244 70
            L 292 86
            L 344 176
            L 298 198
            L 276 150
            L 278 366
            Q 200 371 122 366
            L 124 150
            L 102 198
            L 56 176
            L 108 86
            Z
          "
          fill={`url(#${gradId})`}
        />

        {/* Crewneck ribbed collar band */}
        <path
          d="M 150 72 Q 200 105 250 72 Q 244 68 242 70 Q 200 95 158 70 Q 156 68 150 72 Z"
          fill={palette.hex}
          stroke={palette.shadow}
          strokeWidth="1"
          opacity="0.85"
        />

        {/* Subtle vertical fabric drape folds for realism */}
        <path
          d="M 152 150 Q 148 255 144 364"
          stroke={palette.shadow}
          strokeWidth="3"
          fill="none"
          opacity={palette.light ? '0.22' : '0.32'}
        />
        <path
          d="M 248 165 Q 254 265 258 364"
          stroke={palette.shadow}
          strokeWidth="3.5"
          fill="none"
          opacity={palette.light ? '0.22' : '0.32'}
        />
        <path
          d="M 196 190 Q 193 280 190 366"
          stroke={palette.highlight}
          strokeWidth="2.5"
          fill="none"
          opacity="0.18"
        />

        {/* Armhole seam lines */}
        <path
          d="M 108 86 Q 122 124 124 150"
          stroke={palette.shadow}
          strokeWidth="1.2"
          fill="none"
          opacity="0.35"
        />
        <path
          d="M 292 86 Q 278 124 276 150"
          stroke={palette.shadow}
          strokeWidth="1.2"
          fill="none"
          opacity="0.35"
        />

        {/* Optional Minimalist Geometric Chest Graphic */}
        {showGraphic && (
          <g opacity="0.82" transform="translate(200, 185)">
            {index % 2 === 0 ? (
              <>
                <circle
                  cx="0"
                  cy="0"
                  r="34"
                  fill={palette.light ? '#d5c4a1' : 'none'}
                  stroke={palette.light ? '#baa378' : '#7c8087'}
                  strokeWidth="1.5"
                />
                <line
                  x1="-26"
                  y1="12"
                  x2="26"
                  y2="-12"
                  stroke={palette.light ? '#8c7651' : '#9ca0a6'}
                  strokeWidth="1.5"
                />
                <line
                  x1="-18"
                  y1="22"
                  x2="18"
                  y2="-22"
                  stroke={palette.light ? '#8c7651' : '#9ca0a6'}
                  strokeWidth="1.5"
                />
              </>
            ) : (
              <polygon
                points="0,-32 32,26 -32,26"
                fill="none"
                stroke={palette.light ? '#7a684b' : '#9fa3a9'}
                strokeWidth="1.8"
              />
            )}
          </g>
        )}
      </g>
    </svg>
  )
}

