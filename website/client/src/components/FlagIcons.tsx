import React from 'react'

export interface FlagIconProps {
  className?: string
}

export function FlagUK({ className = 'nx-flag-icon' }: FlagIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 480"
      width="20"
      height="14"
      style={{
        borderRadius: '2px',
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: '0 0 1px rgba(0,0,0,0.25)',
      }}
      aria-hidden="true"
    >
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path
        fill="#FFF"
        d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-179L0 64V0h75z"
      />
      <path
        fill="#C8102E"
        d="m424 288 216 159v33h-44L367 332l57-44zM640 0v10L443 157l54 44 143-107V0h-44l-2 1zM0 480v-10l197-147-54-44L0 386v94h44l2-1zM0 0v41l173 130-57 43L0 102V0h44l2 1z"
      />
      <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z" />
      <path fill="#C8102E" d="M267 0h107v480H267zM0 187h640v107H0z" />
    </svg>
  )
}

export function FlagCambodia({ className = 'nx-flag-icon' }: FlagIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 420"
      width="20"
      height="14"
      style={{
        borderRadius: '2px',
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: '0 0 1px rgba(0,0,0,0.25)',
      }}
      aria-hidden="true"
    >
      <rect width="640" height="105" fill="#032ea1" />
      <rect y="105" width="640" height="210" fill="#e00025" />
      <rect y="315" width="640" height="105" fill="#032ea1" />
      <g fill="#ffffff">
        <rect x="232" y="278" width="176" height="14" rx="1" />
        <rect x="246" y="266" width="148" height="12" />
        <rect x="260" y="254" width="120" height="12" />
        <path d="M 313 254 L 313 162 C 313 154 320 144 320 138 C 320 144 327 154 327 162 L 327 254 Z" />
        <polygon points="307,215 333,215 320,180" />
        <rect x="312" y="222" width="16" height="32" />
        <path d="M 276 254 L 276 180 C 276 174 282 166 282 160 C 282 166 288 174 288 180 L 288 254 Z" />
        <polygon points="271,225 293,225 282,198" />
        <rect x="274" y="230" width="16" height="24" />
        <path d="M 352 254 L 352 180 C 352 174 358 166 358 160 C 358 166 364 174 364 180 L 364 254 Z" />
        <polygon points="347,225 369,225 358,198" />
        <rect x="350" y="230" width="16" height="24" />
        <rect x="288" y="244" width="25" height="10" />
        <rect x="327" y="244" width="25" height="10" />
      </g>
    </svg>
  )
}

