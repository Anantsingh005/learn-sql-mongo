const CODE = [
  { parts: [['SELECT', 'kw'], [' p.name, p.price', 'txt']] },
  { parts: [['FROM', 'kw'], [' products p', 'txt']] },
  { parts: [['JOIN', 'kw'], [' orders o ON o.product_id = p.id', 'txt']] },
  { parts: [['WHERE', 'kw'], [' p.price > ', 'txt'], ['50', 'num']] },
  { parts: [['GROUP BY', 'kw'], [' p.id', 'txt']] },
  { parts: [['ORDER BY', 'kw'], [' sold ', 'kw'], ['DESC', 'kw']] },
  { parts: [['LIMIT', 'kw'], [' ', 'txt'], ['3', 'num'], [';', 'txt']] },
]

const CODE_TONE = {
  kw: '#A9C6F5',
  txt: '#D9E2EC',
  num: '#CBE7D6',
}

const CODE_SIZE = 10.5
const CODE_X = 218
const CODE_TOP = 100
const CODE_LINE_H = 18

const LAST_CODE_Y = CODE_TOP + (CODE.length - 1) * CODE_LINE_H
const LAST_LINE_CHARS = CODE[CODE.length - 1].parts.reduce((n, [text]) => n + text.length, 0)
const CARET_X = CODE_X + LAST_LINE_CHARS * (CODE_SIZE * 0.6) + 2

function CodeLine({ y, parts, index }) {
  return (
    <text
      className="code-cycle"
      style={{ animationDelay: `${index * 45}ms` }}
      x="218"
      y={y}
      fontFamily="'JetBrains Mono', ui-monospace, monospace"
      fontSize="10.5"
      xmlSpace="preserve"
    >
      {parts.map(([text, tone], i) => (
        <tspan key={i} fill={CODE_TONE[tone]}>
          {text}
        </tspan>
      ))}
    </text>
  )
}

function Label({ x, y, children, fill = '#FFFFFF', size = 10, weight = 700, spacing = '0.14em' }) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontFamily="Inter, system-ui, sans-serif"
      fontSize={size}
      fontWeight={weight}
      letterSpacing={spacing}
    >
      {children}
    </text>
  )
}

export default function WorkspaceVisual({ className = '' }) {
  return (
    <svg
      viewBox="0 0 640 470"
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label="A laptop running a SQL query, with a plant, a stack of database books, a coffee and a notepad"
    >
      <defs>
        <filter id="dbquiz-soft" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <clipPath id="dbquiz-screen">
          <rect x="180" y="48" width="360" height="248" rx="8" />
        </clipPath>
      </defs>

      <g fill="#102A43" opacity="0.07" filter="url(#dbquiz-soft)">
        <ellipse cx="320" cy="352" rx="228" ry="15" />
        <ellipse cx="527" cy="332" rx="72" ry="10" />
        <ellipse cx="110" cy="322" rx="54" ry="9" />
        <ellipse cx="182" cy="376" rx="44" ry="9" />
        <ellipse cx="520" cy="432" rx="88" ry="10" />
      </g>

      <g>
        <rect x="168" y="36" width="384" height="274" rx="14" fill="#102A43" />
        <rect x="180" y="48" width="360" height="248" rx="8" fill="#102a43" />

        <g clipPath="url(#dbquiz-screen)">
          <rect x="180" y="48" width="360" height="30" fill="#16324B" />
          <circle cx="199" cy="63" r="4.5" fill="#6F97E8" />
          <circle cx="213" cy="63" r="4.5" fill="#4C9A68" />
          <circle cx="227" cy="63" r="4.5" fill="#8FA3BA" />
          <rect x="240" y="55" width="74" height="16" rx="4" fill="#1E3F5E" />
          <text x="249" y="66.5" fill="#A9C6F5" fontFamily="'JetBrains Mono', monospace" fontSize="8.5">
            query.sql
          </text>
          <text x="328" y="66.5" fill="#56708C" fontFamily="'JetBrains Mono', monospace" fontSize="8.5">
            store.db
          </text>

          <rect x="180" y="78" width="26" height="184" fill="#102a43" />
          {CODE.map((line, i) => (
            <text
              key={`n${i}`}
              x="188"
              y={CODE_TOP + i * CODE_LINE_H}
              fill="#4A6076"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="8.5"
            >
              {i + 1}
            </text>
          ))}
          {CODE.map((line, i) => (
            <CodeLine key={`c${i}`} y={CODE_TOP + i * CODE_LINE_H} parts={line.parts} index={i} />
          ))}

          <rect
            className="caret-blink"
            x={CARET_X}
            y={LAST_CODE_Y - 9}
            width="6"
            height="12"
            rx="1"
            fill={CODE_TONE.kw}
          />

          <rect x="180" y="262" width="360" height="34" fill="#102a43" />
          <line x1="180" y1="262" x2="540" y2="262" stroke="#1B3550" strokeWidth="1" />
          <g className="status-cycle">
            <circle cx="199" cy="279" r="4" fill="#4C9A68" />
            <text x="211" y="282" fill="#CBE7D6" fontFamily="'JetBrains Mono', monospace" fontSize="9">
              3 rows
            </text>
            <text x="524" y="282" fill="#56708C" fontFamily="'JetBrains Mono', monospace" fontSize="9">
              4ms
            </text>
          </g>
        </g>

        <rect x="170" y="302" width="380" height="10" rx="5" fill="#C9D5E2" />
        <path
          d="M170 308H550L578 336A7 7 0 0 1 571 343H149A7 7 0 0 1 142 336Z"
          fill="#E7EDF4"
          stroke="#D9E2EC"
          strokeWidth="1.5"
        />
        <rect x="322" y="330" width="76" height="5" rx="2.5" fill="#D9E2EC" />
      </g>

      <g>
        <path d="M86 270h48l-8 46H94Z" fill="#D9E2EC" />
        <rect x="80" y="262" width="60" height="11" rx="5.5" fill="#C6D3E1" />
        <g stroke="#4C9A68" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M110 262c-2-20-12-32-24-38" />
          <path d="M110 262c2-22 12-34 26-40" />
          <path d="M110 262v-30" />
        </g>
        <path d="M86 224c-16-2-24-15-18-27 16 0 26 11 22 25Z" fill="#4C9A68" />
        <path d="M136 222c16-6 21-22 12-32-16 4-24 18-18 32Z" fill="#3F8459" />
        <path d="M110 232c-14-6-17-22-7-31 14 5 18 19 11 31Z" fill="#63A97E" />
      </g>

      <g>
        <rect x="468" y="292" width="118" height="28" rx="4" fill="#1554C7" />
        <rect x="580" y="297" width="7" height="18" rx="2" fill="#E7EDF4" />
        <Label x="480" y="311">SQL</Label>

        <rect x="478" y="266" width="112" height="26" rx="4" fill="#F3F7FF" stroke="#D9E2EC" strokeWidth="1.5" />
        <rect x="584" y="271" width="7" height="16" rx="2" fill="#E7EDF4" stroke="#D9E2EC" strokeWidth="1" />
        <Label x="489" y="283" fill="#243B53" size={8.5} weight={600}>
          DATABASE
        </Label>

        <rect x="488" y="242" width="104" height="24" rx="4" fill="#4C9A68" />
        <rect x="586" y="246" width="6" height="15" rx="2" fill="#E6F4EC" />
        <Label x="498" y="258">DB</Label>
      </g>

      <g>
        <ellipse cx="182" cy="372" rx="42" ry="8" fill="#E7EDF4" stroke="#D9E2EC" strokeWidth="1.5" />
        <path d="M158 320h48l-6 42q-18 7-36 0Z" fill="#FFFFFF" stroke="#C6D3E1" strokeWidth="1.5" />
        <ellipse cx="182" cy="320" rx="24" ry="7" fill="#F4F8FF" stroke="#C6D3E1" strokeWidth="1.5" />
        <path
          d="M206 330c14 0 14 22-2 22"
          fill="none"
          stroke="#C6D3E1"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <g fill="none" stroke="#C6D3E1" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          <path className="steam-a" d="M172 306c-4-10 4-14 0-24" />
          <path className="steam-b" d="M192 306c4-10-4-14 0-24" />
        </g>
      </g>

      <g transform="rotate(-5 520 380)">
        <rect x="436" y="330" width="170" height="96" rx="8" fill="#FFFFFF" stroke="#D9E2EC" strokeWidth="1.5" />
        <rect x="452" y="344" width="46" height="6" rx="3" fill="#1554C7" />
        <g stroke="#E7EDF4" strokeWidth="1.5">
          <line x1="452" y1="366" x2="590" y2="366" />
          <line x1="452" y1="382" x2="590" y2="382" />
          <line x1="452" y1="398" x2="546" y2="398" />
        </g>
        <g fill="#D9E2EC">
          <rect x="431" y="348" width="8" height="5" rx="2.5" />
          <rect x="431" y="364" width="8" height="5" rx="2.5" />
          <rect x="431" y="380" width="8" height="5" rx="2.5" />
          <rect x="431" y="396" width="8" height="5" rx="2.5" />
          <rect x="431" y="412" width="8" height="5" rx="2.5" />
        </g>
      </g>
    </svg>
  )
}
