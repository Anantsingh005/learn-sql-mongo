// One small, decorative line illustration per chapter topic, all drawn in a
// single shared style (rounded 128x112 canvas, 2px accent strokes, soft tinted
// fills). Purely presentational: the reader varies by position, not by content.

const HEX = /^#[0-9a-fA-F]{6}$/

function tint(accent, alpha) {
  if (!HEX.test(accent)) return 'transparent'
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return `${accent}${a}`
}

function TableArt({ accent }) {
  return (
    <g>
      <rect x="26" y="26" width="76" height="60" rx="8" stroke={accent} strokeWidth="2" fill={tint(accent, 0.06)} />
      <rect x="26" y="58" width="76" height="13" fill={tint(accent, 0.14)} />
      <path d="M26 42h76" stroke={accent} strokeWidth="2" />
      <path d="M51 42v44M76 42v44" stroke={accent} strokeWidth="1.6" opacity="0.4" />
      <path d="M34 34h10M59 34h10M84 34h10" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 64.5h12M57 64.5h12M82 64.5h12" stroke={accent} strokeWidth="2" opacity="0.55" strokeLinecap="round" />
      <path d="M32 78h12M57 78h12M82 78h12" stroke={accent} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    </g>
  )
}

function FunnelArt({ accent }) {
  return (
    <g>
      <path d="M20 22h88L78 60H50Z" stroke={accent} strokeWidth="2" fill={tint(accent, 0.1)} strokeLinejoin="round" />
      <path d="M56 60h16v6a8 8 0 0 1-16 0Z" stroke={accent} strokeWidth="2" fill={tint(accent, 0.1)} strokeLinejoin="round" />
      <circle cx="40" cy="12" r="3.2" fill={accent} opacity="0.5" />
      <circle cx="64" cy="10" r="3.2" fill={accent} />
      <circle cx="88" cy="12" r="3.2" fill={accent} opacity="0.5" />
      <circle cx="64" cy="86" r="4" fill={accent} />
    </g>
  )
}

function SortArt({ accent }) {
  return (
    <g>
      <rect x="24" y="30" width="34" height="12" rx="6" fill={accent} opacity="0.35" />
      <rect x="24" y="50" width="48" height="12" rx="6" fill={accent} opacity="0.6" />
      <rect x="24" y="70" width="62" height="12" rx="6" fill={accent} />
      <path d="M102 26v60" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <path d="M102 26l-6 8M102 26l6 8" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function LinkedTablesArt({ accent }) {
  return (
    <g>
      <rect x="16" y="34" width="42" height="44" rx="7" stroke={accent} strokeWidth="2" fill={tint(accent, 0.06)} />
      <rect x="70" y="34" width="42" height="44" rx="7" stroke={accent} strokeWidth="2" fill={tint(accent, 0.06)} />
      <path d="M16 48h42M16 62h42M70 48h42M70 62h42" stroke={accent} strokeWidth="1.4" opacity="0.4" />
      <circle cx="30" cy="55" r="3.4" fill={accent} />
      <circle cx="84" cy="55" r="3.4" fill={accent} />
      <path d="M58 55h12" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
    </g>
  )
}

function NestedCirclesArt({ accent }) {
  return (
    <g>
      <circle cx="64" cy="56" r="34" stroke={accent} strokeWidth="2" opacity="0.35" />
      <circle cx="64" cy="56" r="22" stroke={accent} strokeWidth="2" opacity="0.6" />
      <circle cx="64" cy="56" r="11" fill={tint(accent, 0.2)} stroke={accent} strokeWidth="2" />
      <circle cx="64" cy="22" r="3" fill={accent} />
      <circle cx="95" cy="72" r="3" fill={accent} opacity="0.7" />
      <circle cx="33" cy="72" r="3" fill={accent} opacity="0.7" />
    </g>
  )
}

function GroupedBarsArt({ accent }) {
  return (
    <g>
      <path d="M22 86h84" stroke={accent} strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      <rect x="24" y="60" width="9" height="26" rx="3" fill={accent} opacity="0.35" />
      <rect x="37" y="42" width="9" height="44" rx="3" fill={accent} />
      <rect x="56" y="48" width="9" height="38" rx="3" fill={accent} opacity="0.35" />
      <rect x="69" y="32" width="9" height="54" rx="3" fill={accent} />
      <rect x="88" y="56" width="9" height="30" rx="3" fill={accent} opacity="0.35" />
      <rect x="101" y="24" width="9" height="62" rx="3" fill={accent} />
    </g>
  )
}

function PencilArt({ accent }) {
  return (
    <g>
      <g transform="rotate(-45 64 56)">
        <rect x="56" y="18" width="16" height="44" rx="3" stroke={accent} strokeWidth="2" fill={tint(accent, 0.12)} />
        <path d="M57.5 26h13" stroke={accent} strokeWidth="2" />
        <path d="M56 62h16l-8 14Z" stroke={accent} strokeWidth="2" fill={tint(accent, 0.22)} strokeLinejoin="round" />
        <path d="M60.5 70l3.5 6 3.5-6Z" fill={accent} />
      </g>
      <path d="M28 94h72" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 8" />
    </g>
  )
}

function WindowFrameArt({ accent }) {
  return (
    <g>
      <rect x="20" y="26" width="88" height="60" rx="8" stroke={accent} strokeWidth="2" fill={tint(accent, 0.05)} />
      <rect x="52" y="40" width="26" height="46" fill={tint(accent, 0.16)} />
      <path d="M20 40h88" stroke={accent} strokeWidth="2" />
      <path d="M52 40v46M78 40v46M20 58h88M20 72h88" stroke={accent} strokeWidth="1.4" opacity="0.4" />
      <circle cx="30" cy="33" r="2.2" fill={accent} opacity="0.6" />
      <circle cx="38" cy="33" r="2.2" fill={accent} opacity="0.6" />
      <path d="M45 48l-5 6 5 6M83 48l5 6-5 6" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

const ART = [
  TableArt,
  FunnelArt,
  SortArt,
  LinkedTablesArt,
  NestedCirclesArt,
  GroupedBarsArt,
  PencilArt,
  WindowFrameArt,
]

export default function ChapterArt({ index = 0, accent = '#db2777', className = 'h-28 w-auto' }) {
  const n = ART.length
  const Art = ART[((index % n) + n) % n]

  return (
    <svg viewBox="0 0 128 112" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="4" width="120" height="104" rx="18" fill={accent} opacity="0.07" />
      <Art accent={accent} />
    </svg>
  )
}
