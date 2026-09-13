import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  children?: ReactNode
}

export function Icon({ size = 24, children }: IconProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {children}
    </span>
  )
}
