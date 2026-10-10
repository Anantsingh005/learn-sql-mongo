import { useEffect, useState } from 'react'
import { CodeIcon } from './icons.jsx'

// Four-point sparkle, shared shape across the site's hero scenes.
const SPARK = 'M0 -13 C1.5 -4 4 -1.5 13 0 C4 1.5 1.5 4 0 13 C-1.5 4 -4 1.5 -13 0 C-4 -1.5 -1.5 -4 0 -13 Z'

// Scoped to the home hero scene. Every looping animation is disabled under
// prefers-reduced-motion. Only transform and opacity are animated — the code
// "typing" is a JS substring reveal, so it never reflows the page.
const SCENE_ANIM = `
@keyframes hs-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-11px); } }
@keyframes hs-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes hs-steam { 0% { opacity: 0; transform: translateY(6px); } 30% { opacity: 0.8; } 100% { opacity: 0; transform: translateY(-20px); } }
@keyframes hs-caret { 0%, 55% { opacity: 1; } 60%, 100% { opacity: 0; } }
@keyframes hs-scene-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } }
.hs-float { animation: hs-float 6.4s ease-in-out infinite; }
.hs-twinkle { animation: hs-twinkle 3.2s ease-in-out infinite; }
.hs-steam { animation: hs-steam 3s ease-in-out infinite; }
.hs-steam-b { animation: hs-steam 3s ease-in-out -1.5s infinite; }
.hs-caret { animation: hs-caret 1.05s steps(1, end) infinite; }
.hs-scene-in { animation: hs-scene-in 720ms var(--ease-out-soft) both; }
@media (prefers-reduced-motion: reduce) {
  .hs-float, .hs-twinkle, .hs-steam, .hs-steam-b, .hs-caret { animation: none; }
  .hs-caret { opacity: 1; }
  .hs-scene-in { animation: none; opacity: 1; transform: none; }
}
`

/* The laptop's query, split into coloured runs. Typed out once on mount. */
const KW = '#f0a8da'
const R1 = '#cbb3dd'
const R2 = '#9fe8c0'
const CODE = [
  [{ t: 'SELECT', c: KW }, { t: ' * FROM users', c: R1 }],
  [{ t: 'WHERE', c: KW }, { t: ' id = 1;', c: R2 }],
]

const CODE_OFFSETS = []
let CODE_TOTAL = 0
for (const line of CODE) {
  CODE_OFFSETS.push(CODE_TOTAL)
  CODE_TOTAL += line.reduce((n, part) => n + part.t.length, 0)
}

const CODE_X = 164
const CODE_Y = [116, 138]
const CHAR_W = 7.8

const SQL_DISCS = [
  { y: 6, body: '#8c1568', top: '#f0a8da' },
  { y: 23, body: '#b01f82', top: '#e46bbf' },
  { y: 40, body: '#d4349e', top: '#fdf0f8' },
]

const MONGO_DISCS = [
  { y: 6, body: '#2f7a4f', top: '#8fd3a8' },
  { y: 23, body: '#3d7f55', top: '#a7e0bd' },
  { y: 40, body: '#58a874', top: '#d6f2e0' },
]

const SPARKLES = [
  { x: 86, y: 66, s: 1.15, fill: '#d4349e', delay: '0s', dur: '3.2s' },
  { x: 470, y: 92, s: 0.85, fill: '#9575e0', delay: '-0.8s', dur: '2.6s' },
  { x: 58, y: 196, s: 0.8, fill: '#e46bbf', delay: '-1.6s', dur: '3.6s' },
  { x: 508, y: 230, s: 0.75, fill: '#6cae85', delay: '-2.2s', dur: '3s' },
  { x: 300, y: 38, s: 0.7, fill: '#c98a2e', delay: '-1.1s', dur: '3.4s' },
]

function Disc({ y, body, top }) {
  return (
    <>
      <path d={`M-38 ${y + 15} a38 13 0 0 0 76 0 V${y} h-76 Z`} fill={body} />
      <ellipse cx="0" cy={y} rx="38" ry="13" fill={top} />
    </>
  )
}

// Reveal a character count once, so the query "types" a single time.
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function useTypeOnce(total) {
  const reduce = prefersReducedMotion()
  const [count, setCount] = useState(reduce ? total : 0)

  useEffect(() => {
    if (reduce) return undefined
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setCount(i)
      if (i >= total) window.clearInterval(id)
    }, 46)
    return () => window.clearInterval(id)
  }, [reduce, total])

  return count
}

export default function HeroScene() {
  const typed = useTypeOnce(CODE_TOTAL)

  let caretLine = CODE.length - 1
  for (let li = 0; li < CODE.length; li += 1) {
    const len = CODE[li].reduce((n, part) => n + part.t.length, 0)
    if (typed < CODE_OFFSETS[li] + len) {
      caretLine = li
      break
    }
  }
  const caretLineLen = CODE[caretLine].reduce((n, part) => n + part.t.length, 0)
  const caretVisible = Math.max(0, Math.min(typed - CODE_OFFSETS[caretLine], caretLineLen))

  return (
    <div className="hs-scene-in relative mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:max-w-none">
      <style>{SCENE_ANIM}</style>

      <svg
        viewBox="0 0 560 420"
        className="h-auto w-full select-none"
        role="img"
        aria-label="A laptop showing a SQL query, with a purple SQL database stack, a green MongoDB stack with a leaf, a potted plant, a coffee mug with a code symbol, soft clouds and sparkles"
      >
        <defs>
          <linearGradient id="hs-screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a1554" />
            <stop offset="100%" stopColor="#1b0930" />
          </linearGradient>
          <clipPath id="hs-screen-clip">
            <rect x="148" y="64" width="264" height="168" rx="10" />
          </clipPath>
        </defs>

        {/* Soft cloud shapes behind the scene */}
        <g opacity="0.9">
          <ellipse cx="112" cy="92" rx="74" ry="34" fill="#f9e9f6" />
          <ellipse cx="172" cy="74" rx="46" ry="26" fill="#f4e9fc" />
          <ellipse cx="452" cy="112" rx="70" ry="30" fill="#f7eefc" />
          <ellipse cx="96" cy="360" rx="60" ry="24" fill="#fdf0f8" />
        </g>

        {/* Ground shadow */}
        <ellipse cx="288" cy="300" rx="210" ry="16" fill="#2d0022" opacity="0.07" />

        {/* Potted plant (left) */}
        <g transform="translate(70 296)">
          <path d="M-26 0 h52 l-8 40 q-18 7 -36 0 Z" fill="#efe6f7" stroke="#d3c2e6" strokeWidth="1.5" />
          <rect x="-29" y="-8" width="58" height="12" rx="6" fill="#e2d5f0" stroke="#d3c2e6" strokeWidth="1.5" />
          <g stroke="#4c9a68" strokeWidth="3.2" fill="none" strokeLinecap="round">
            <path d="M0 -8c-2-22-12-34-26-40" />
            <path d="M0 -8c2-24 12-36 28-42" />
            <path d="M0 -8v-32" />
          </g>
          <path d="M-26 -48c-16-2-24-15-18-27 16 0 26 11 22 25Z" fill="#4c9a68" />
          <path d="M28 -50c16-6 21-22 12-32-16 4-24 18-18 32Z" fill="#3f8459" />
          <path d="M0 -40c-14-6-17-22-7-31 14 5 18 19 11 31Z" fill="#63a97e" />
        </g>

        {/* Laptop (center) */}
        <g>
          <path d="M136 244 h288 l24 30 a7 7 0 0 1 -6 10 H118 a7 7 0 0 1 -6 -10 Z" fill="#efe6f7" stroke="#d3c2e6" strokeWidth="1.5" />
          <rect x="136" y="236" width="288" height="10" rx="5" fill="#c9b3dd" />
          <rect x="252" y="266" width="56" height="6" rx="3" fill="#cdb9e0" />
          <rect x="136" y="52" width="288" height="192" rx="16" fill="#2d1042" />
          <rect x="148" y="64" width="264" height="168" rx="10" fill="url(#hs-screen)" />
          <g clipPath="url(#hs-screen-clip)">
            <rect x="148" y="64" width="264" height="26" fill="#2a0e40" />
            <circle cx="162" cy="77" r="4" fill="#f0a8da" />
            <circle cx="176" cy="77" r="4" fill="#9575e0" />
            <circle cx="190" cy="77" r="4" fill="#6cae85" />
            <text x="202" y="81" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="9" fill="#cbb3dd">
              query.sql
            </text>
            {CODE.map((line, li) => {
              let remaining = typed - CODE_OFFSETS[li]
              return (
                <text
                  key={li}
                  x={CODE_X}
                  y={CODE_Y[li]}
                  fontFamily="'JetBrains Mono Variable', ui-monospace, monospace"
                  fontSize="13"
                  fontWeight="700"
                  xmlSpace="preserve"
                >
                  {line.map((part, pi) => {
                    const show = Math.max(0, Math.min(remaining, part.t.length))
                    remaining -= part.t.length
                    return (
                      <tspan key={pi} fill={part.c}>
                        {part.t.slice(0, show)}
                      </tspan>
                    )
                  })}
                </text>
              )
            })}
            <rect
              className="hs-caret"
              x={CODE_X + caretVisible * CHAR_W}
              y={CODE_Y[caretLine] - 11}
              width="7"
              height="13"
              rx="1"
              fill={KW}
            />
          </g>
        </g>

        {/* Purple SQL database stack (front-left) */}
        <g className="hs-float" style={{ animationDelay: '0s', animationDuration: '6.4s' }}>
          <g transform="translate(150 300) rotate(-5)">
            <ellipse cx="0" cy="58" rx="42" ry="10" fill="#2d0022" opacity="0.12" />
            {SQL_DISCS.map((disc) => (
              <Disc key={disc.y} {...disc} />
            ))}
            <text
              x="0"
              y="78"
              textAnchor="middle"
              fontFamily="'Inter Variable', system-ui, sans-serif"
              fontSize="14"
              fontWeight="800"
              letterSpacing="0.14em"
              fill="#8c1568"
            >
              SQL
            </text>
          </g>
        </g>

        {/* Green MongoDB database stack with a leaf (right) */}
        <g className="hs-float" style={{ animationDelay: '-2.4s', animationDuration: '7.2s' }}>
          <g transform="translate(432 296) rotate(5)">
            <ellipse cx="0" cy="58" rx="42" ry="10" fill="#2d0022" opacity="0.12" />
            {MONGO_DISCS.map((disc) => (
              <Disc key={disc.y} {...disc} />
            ))}
            <g transform="translate(26 -22) scale(0.82)" fill="none" stroke="#2f7a4f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.5 3.5c-7 .5-11 4-12.5 8.5-1 3-.5 6 1 8" />
              <path d="M9 20c-1.5-2-2-5-1-8 1.5-4.5 5.5-7 12.5-8.5" />
            </g>
            <text
              x="0"
              y="78"
              textAnchor="middle"
              fontFamily="'Inter Variable', system-ui, sans-serif"
              fontSize="12"
              fontWeight="800"
              letterSpacing="0.1em"
              fill="#2f7a4f"
            >
              MongoDB
            </text>
          </g>
        </g>

        {/* Coffee mug with a code symbol, steam rising */}
        <g transform="translate(286 300)">
          <ellipse cx="0" cy="34" rx="44" ry="9" fill="#2d0022" opacity="0.1" />
          <path d="M-22 -34 h44 l-5 34 q-17 6 -34 0 Z" fill="#ffffff" stroke="#d9c9ea" strokeWidth="1.6" />
          <ellipse cx="0" cy="-34" rx="22" ry="6.5" fill="#f6f0fb" stroke="#d9c9ea" strokeWidth="1.6" />
          <path d="M22 -26c12 0 12 20-2 20" fill="none" stroke="#d9c9ea" strokeWidth="4" strokeLinecap="round" />
          <text x="0" y="-6" textAnchor="middle" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="12" fontWeight="700" fill="#8c1568">
            {'</>'}
          </text>
          <g fill="none" stroke="#cbb3dd" strokeWidth="2.6" strokeLinecap="round">
            <path className="hs-steam" d="M-8 -44c-4-9 4-13 0-22" />
            <path className="hs-steam-b" d="M8 -44c4-9-4-13 0-22" />
          </g>
        </g>

        {/* Sparkles (staggered twinkle) */}
        <g>
          {SPARKLES.map((sp, i) => (
            <path
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="hs-twinkle"
              style={{ animationDelay: sp.delay, animationDuration: sp.dur }}
              transform={`translate(${sp.x} ${sp.y}) scale(${sp.s})`}
              d={SPARK}
              fill={sp.fill}
            />
          ))}
        </g>
      </svg>

      {/* Handwritten sticky note + floating code badge */}
      <div className="pointer-events-none absolute right-0 top-1 rotate-[4deg]">
        <div className="relative rounded-[10px] bg-[#fff5c9] px-3.5 py-2.5 shadow-[0_12px_26px_-16px_rgba(45,0,34,0.6)] ring-1 ring-amber-200/80">
          <p className="font-hand text-[17px] font-bold leading-[1.05] text-[#8a550b] sm:text-[20px]">
            Better Queries,
            <br />
            Bigger Dreams
          </p>
        </div>
        <span
          className="hs-float absolute -left-4 top-7 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-md sm:h-8 sm:w-8"
          style={{ animationDuration: '5s' }}
        >
          <CodeIcon size={15} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  )
}
