import React from 'react'

interface GoogleIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  className?: string
  filled?: boolean
  size?: number | string
}

export function GoogleIcon({
  name,
  className = '',
  filled = false,
  size,
  style,
  ...rest
}: GoogleIconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none inline-flex items-center justify-center leading-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    >
      {name}
    </span>
  )
}

export default GoogleIcon
