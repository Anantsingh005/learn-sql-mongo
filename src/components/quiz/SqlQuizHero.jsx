import { useEffect, useState } from 'react'

const CODE_LINES = [
  'SELECT * FROM users WHERE id = 1;',
  'SELECT name, email FROM users ORDER BY created_at DESC;',
  'SELECT COUNT(*) FROM orders WHERE status = "completed";',
]

function useTypingEffect(text, speed = 40, enabled = true) {
  const [display, setDisplay] = useState(enabled ? '' : text)
  useEffect(() => {
    if (!enabled) return undefined
    let i = 0
    let cancelled = false
    setDisplay('')
    const timer = setInterval(() => {
      if (cancelled) return
      i += 1
      setDisplay(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [text, speed, enabled])
  return display
}

const chips = [
  {
    title: 'Real SQL Environment',
    color: 'brand',
    svg: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
  },
  {
    title: 'Instant Feedback',
    color: 'leaf',
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
  {
    title: 'Track Progress',
    color: 'amber',
    svg: (
      <>
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m7 16 4-6 4 4 4-8" />
      </>
    ),
  },
  {
    title: 'Earn Badges',
    color: 'plum',
    svg: (
      <>
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </>
    ),
  },
]

function SqlQuizHero() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const line1 = useTypingEffect(CODE_LINES[0], 30, !prefersReducedMotion)
  const line2 = useTypingEffect(CODE_LINES[1], 30, !prefersReducedMotion)
  const line3 = useTypingEffect(CODE_LINES[2], 30, !prefersReducedMotion)
  const [sparkle1, setSparkle1] = useState(0.5)
  const [sparkle2, setSparkle2] = useState(0.8)

  useEffect(() => {
    if (prefersReducedMotion) return undefined
    const interval = setInterval(() => {
      setSparkle1(Math.random())
      setSparkle2(Math.random())
    }, 800)
    return () => clearInterval(interval)
  }, [prefersReducedMotion])

  return (
    <div className="enter-rise relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-plum-50 p-6 sm:p-8">
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          <div
            className="enter-rise font-mono text-[10px] font-bold uppercase tracking-[0.5em] text-brand-600"
            style={{ animationDelay: '80ms' }}
          >
            LEARN &gt; PRACTICE &gt; GROW
          </div>
          <h1 className="space-y-1 font-mono text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            <div className="enter-rise" style={{ animationDelay: '160ms' }}>
              Test your
            </div>
            <div
              className="enter-rise bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text text-transparent"
              style={{ animationDelay: '220ms' }}
            >
              database skills
            </div>
          </h1>
          <p
            className="enter-rise max-w-lg text-sm leading-relaxed text-muted sm:text-base"
            style={{ animationDelay: '280ms' }}
          >
            Build real SQL queries, solve challenges and track your progress. Get better, one question at a time.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {chips.map((chip, i) => (
              <div
                key={chip.title}
                className="enter-rise flex items-center gap-2 rounded-xl border border-brand-100 bg-white/80 px-3 py-2"
                style={{ animationDelay: `${340 + i * 60}ms` }}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${chip.color}-50 text-${chip.color}-600`}>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {chip.svg}
                  </svg>
                </span>
                <span className="text-xs font-medium text-body">{chip.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px]">
          <svg viewBox="0 0 360 280" className="h-auto w-full" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="screen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
              <linearGradient id="note" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>

            <g className={prefersReducedMotion ? '' : 'animate-[float-soft_6.5s_ease-in-out_infinite]'}>
              <ellipse cx="70" cy="220" rx="28" ry="12" fill="#f3faf5" />
              <path
                d="M54 180c0-10 6-18 16-18s16 8 16 18v40H54v-40z"
                fill="#86efac"
                stroke="#22c55e"
                strokeWidth="2"
              />
              <path d="M58 180h24M62 168c2-4 8-6 12-4" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M50 192c-6 2-10 6-10 10 0 6 8 10 18 10M82 192c6 2 10 6 10 10 0 6-8 10-18 10"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M64 200v8M76 200v8" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
            </g>

            <g className={prefersReducedMotion ? '' : 'animate-[float-soft_5s_ease-in-out_infinite]'}>
              <rect x="80" y="120" width="200" height="120" rx="12" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="2" />
              <rect x="88" y="128" width="184" height="96" rx="8" fill="url(#screen)" />
              <circle cx="180" cy="224" r="6" fill="#c7d2fe" />
              <rect x="130" y="232" width="100" height="6" rx="3" fill="#c7d2fe" />
            </g>

            <g className={prefersReducedMotion ? '' : 'animate-[float-soft_7s_ease-in-out_infinite_0.5s]'}>
              <path
                d="M250 140h40c6 0 10 4 10 10v60c0 6-4 10-10 10h-40c-6 0-10-4-10-10v-60c0-6 4-10 10-10z"
                fill="#f3e8ff"
                stroke="#d8b4fe"
                strokeWidth="2"
              />
              <ellipse cx="270" cy="220" rx="12" ry="6" fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="2" />
              <path
                d="M260 200c0-4 4-8 10-8s10 4 10 8v20h-20v-20z"
                fill="#c084fc"
                stroke="#a855f7"
                strokeWidth="2"
              />
              <path d="M260 160h20M260 170h20M260 180h16" stroke="#a855f7" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
            </g>

            <g className={prefersReducedMotion ? '' : 'animate-[float-soft_4.5s_ease-in-out_infinite_0.3s]'}>
              <rect x="220" y="80" width="90" height="70" rx="6" transform="rotate(8 265 115)" fill="url(#note)" stroke="#fbbf24" strokeWidth="2" />
              <text x="240" y="110" transform="rotate(8 265 115)" className="font-hand" fontSize="8" fill="#92400e">
                Better Queries,
              </text>
              <text x="245" y="125" transform="rotate(8 265 115)" className="font-hand" fontSize="8" fill="#92400e">
                Bigger Dreams
              </text>
              <path d="M270 95l6-8 6 8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(8 265 115)" />
            </g>

            <g className={prefersReducedMotion ? '' : 'animate-[soft-pulse_3s_ease-in-out_infinite]'}>
              <circle cx="180" cy="176" r="18" fill="#ec4899" opacity="0.9" />
              <polygon points="176,170 188,176 176,182" fill="white" />
            </g>

            <g className="font-mono text-[9px] text-green-400" opacity="0.9">
              <text x="100" y="150">
                {line1}
                {line1.length < CODE_LINES[0].length && <tspan fill="white">|</tspan>}
              </text>
              <text x="100" y="165">
                {line2}
                {line1.length >= CODE_LINES[0].length && line2.length < CODE_LINES[1].length && <tspan fill="white">|</tspan>}
              </text>
              <text x="100" y="180">
                {line3}
                {line1.length >= CODE_LINES[0].length && line2.length >= CODE_LINES[1].length && line3.length < CODE_LINES[2].length && <tspan fill="white">|</tspan>}
              </text>
            </g>

            <g opacity={sparkle1}>
              <circle cx="120" cy="100" r="1.5" fill="#fbbf24" />
              <path d="M118 100h4M120 98v4" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
            </g>
            <g opacity={sparkle2}>
              <circle cx="220" cy="90" r="1.5" fill="#a5b4fc" />
              <path d="M218 90h4M220 88v4" stroke="#a5b4fc" strokeWidth="1" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default SqlQuizHero
