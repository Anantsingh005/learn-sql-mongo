// Small inline icon set for the lesson's content cards. Every icon is drawn on
// the same 24x24 grid with 1.8px strokes and `currentColor`, so a card can tint
// it by setting the text colour on its icon chip.

function Svg({ className = 'h-4 w-4', children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function InfoIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6h.01" />
    </Svg>
  )
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="m5 13 4 4L19 7" />
    </Svg>
  )
}

export function CodeIcon(props) {
  return (
    <Svg {...props}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
    </Svg>
  )
}

export function BulbIcon(props) {
  return (
    <Svg {...props}>
      <path d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.8 10.6c.6.5 1 1.3 1 2.1v.3h5.6v-.3c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </Svg>
  )
}

export function WarnIcon(props) {
  return (
    <Svg {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Svg>
  )
}

export function TableIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11M3 14.5h18" />
    </Svg>
  )
}

export function FlowIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="15" width="8" height="6" rx="1.5" />
      <path d="M7 9v3a2 2 0 0 0 2 2h6a2 2 0 0 1 2 2v-1" />
    </Svg>
  )
}

export function JoinIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </Svg>
  )
}

export function SyntaxIcon(props) {
  return (
    <Svg {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </Svg>
  )
}

export function QuizIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.1 2.5c-.8.3-1.1.9-1.1 1.5v.2" />
      <path d="M11.6 16.6h.01" />
    </Svg>
  )
}

export function CopyIcon(props) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Svg>
  )
}

export function BookIcon(props) {
  return (
    <Svg {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v15.5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2Z" />
      <path d="M4 5v15M8 7h7" />
    </Svg>
  )
}
