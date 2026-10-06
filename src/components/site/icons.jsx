function Svg({ size = 24, children, className = '', strokeWidth = 1.75, viewBox = '0 0 24 24' }) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function LeafIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20.5 3.5c-7 .5-11 4-12.5 8.5-1 3-.5 6 1 8" />
      <path d="M9 20c-1.5-2-2-5-1-8 1.5-4.5 5.5-7 12.5-8.5" />
      <path d="M4 21h7" />
    </Svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  )
}

export function CodeIcon(props) {
  return (
    <Svg {...props}>
      <path d="m8.5 8.5-4 3.5 4 3.5" />
      <path d="m15.5 8.5 4 3.5-4 3.5" />
      <path d="m13.5 5-3 14" />
    </Svg>
  )
}
